import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Video,
} from "lucide-react";
import {
  createGeneratedPost,
  createScheduledPost,
  publishGeneratedPost,
  type ClientCampaignPublishPlatform,
  type ClientGeneratedPost,
  type ClientGeneratedPostPlatform,
  type ClientScheduledPostStatus,
  type ClientSocialAccount,
} from "../lib/clientApi";

type CampaignSourceAsset = {
  id: string;
  title: string;
  description?: string | null;
  asset_type: string;
  file_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  property_id?: string | null;
  property_title?: string | null;
  tags?: string[];
};

type CampaignGoal =
  | "Generate leads"
  | "Site visit"
  | "Property launch"
  | "Brand awareness";

type CampaignTone =
  | "Professional"
  | "Luxury"
  | "Promotional"
  | "Friendly";

type CampaignDraft = {
  platform: ClientCampaignPublishPlatform;
  title: string;
  content: string;
  hashtags: string[];
  warning?: string | null;
  savedPost?: ClientGeneratedPost | null;
};

type CampaignActionResult = {
  platform: ClientCampaignPublishPlatform;
  status: "draft" | "saved" | "scheduled" | "published" | "not_connected" | "failed";
  message: string;
  externalUrl?: string | null;
};

interface CampaignStudioProps {
  darkMode: boolean;
  socialAccounts: ClientSocialAccount[];
  loadingSocialAccounts: boolean;
  onRefreshSocialAccounts: () => void;
  onDraftsChanged: () => Promise<void> | void;
  onNavigate?: (screen: string) => void;
}

const campaignHandoffStorageKey = "rs_campaign_studio_source_asset";

const apiOrigin = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1"
).replace(/\/api\/v1\/?$/, "");

const platformOptions: Array<{
  value: ClientCampaignPublishPlatform;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}> = [
  {
    value: "instagram",
    label: "Instagram Reels",
    shortLabel: "Instagram",
    color: "#e1306c",
    description: "Caption + hashtags for Reels or media posts.",
  },
  {
    value: "facebook",
    label: "Facebook Video",
    shortLabel: "Facebook",
    color: "#1877f2",
    description: "Buyer-friendly local caption for Facebook.",
  },
  {
    value: "youtube",
    label: "YouTube Shorts",
    shortLabel: "YouTube",
    color: "#ff0033",
    description: "Shorts title, description, tags, hook, and voiceover.",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    shortLabel: "LinkedIn",
    color: "#0077b5",
    description: "Professional investor/end-user campaign post.",
  },
];

const campaignGoals: CampaignGoal[] = [
  "Generate leads",
  "Site visit",
  "Property launch",
  "Brand awareness",
];

const campaignTones: CampaignTone[] = [
  "Professional",
  "Luxury",
  "Promotional",
  "Friendly",
];

function resolveAssetUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function platformLabel(platform: ClientCampaignPublishPlatform) {
  return platformOptions.find((option) => option.value === platform)?.label || platform;
}

function platformColor(platform: ClientCampaignPublishPlatform) {
  return platformOptions.find((option) => option.value === platform)?.color || "#1D4ED8";
}

function isConnectedAccount(
  account: ClientSocialAccount,
  platform: ClientCampaignPublishPlatform,
) {
  return (
    String(account.platform).toLowerCase() === platform &&
    account.status === "connected" &&
    account.is_active
  );
}

function getCleanTags(asset?: CampaignSourceAsset | null) {
  const rawTags = Array.isArray(asset?.tags) ? asset?.tags || [] : [];
  return rawTags
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean)));
}

function isMediaAsset(asset?: CampaignSourceAsset | null) {
  return asset?.asset_type === "image" || asset?.asset_type === "video";
}

function needsVideo(platform: ClientCampaignPublishPlatform) {
  return platform === "youtube";
}

function readStoredAsset(): CampaignSourceAsset | null {
  try {
    const raw = window.sessionStorage.getItem(campaignHandoffStorageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CampaignSourceAsset>;
    if (!parsed || !parsed.id || !parsed.title || !parsed.asset_type) {
      return null;
    }

    return {
      id: String(parsed.id),
      title: String(parsed.title),
      description: parsed.description || null,
      asset_type: String(parsed.asset_type),
      file_url: parsed.file_url || null,
      file_name: parsed.file_name || null,
      mime_type: parsed.mime_type || null,
      file_size: parsed.file_size || null,
      property_id: parsed.property_id || null,
      property_title: parsed.property_title || null,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
    };
  } catch {
    return null;
  }
}

function buildDraft(
  asset: CampaignSourceAsset,
  platform: ClientCampaignPublishPlatform,
  goal: CampaignGoal,
  tone: CampaignTone,
): CampaignDraft {
  const cleanTags = getCleanTags(asset);
  const title = asset.title.trim();
  const description =
    asset.description?.trim() ||
    `A focused real estate campaign for ${title}.`;
  const leadCta =
    goal === "Site visit"
      ? "Book your site visit today."
      : goal === "Brand awareness"
        ? "Follow us for more verified property updates."
        : goal === "Property launch"
          ? "DM us for launch pricing, floor plans, and availability."
          : "Message us now for pricing, availability, and a callback.";
  const toneLine =
    tone === "Luxury"
      ? "Premium positioning, polished lifestyle appeal, and high-intent CTA."
      : tone === "Promotional"
        ? "Offer-led, direct, and conversion-focused."
        : tone === "Friendly"
          ? "Warm, simple, and easy for buyers to respond to."
          : "Clear, credible, and professional.";

  const baseTags = uniqueTags([
    ...cleanTags,
    "realestate",
    "property",
    "sitevisit",
    goal.toLowerCase().replace(/\s+/g, ""),
  ]);

  if (platform === "youtube") {
    const tags = uniqueTags([
      ...baseTags,
      "shorts",
      "propertytour",
      "realestateshorts",
      "homebuyers",
    ]);

    return {
      platform,
      title: `${title} | Property Tour #Shorts`.slice(0, 100),
      hashtags: tags,
      warning:
        asset.asset_type !== "video"
          ? "YouTube Shorts requires a linked video asset before live publishing."
          : null,
      content: [
        `YouTube Shorts Title: ${title} | Property Tour #Shorts`,
        "",
        `Description: ${description}`,
        "",
        `Hook: Wait till you see the best part of this property.`,
        "",
        `Voiceover: Looking for a property that balances location, lifestyle, and long-term value? Take a quick look at ${title}. ${description} ${leadCta}`,
        "",
        `Tags: ${tags.join(", ")}`,
        "",
        `Campaign goal: ${goal}`,
        `Tone: ${tone} — ${toneLine}`,
      ].join("\n"),
    };
  }

  if (platform === "instagram") {
    const tags = uniqueTags([...baseTags, "reels", "propertyreels", "dreamhome"]);

    return {
      platform,
      title: `Instagram Reel: ${title}`,
      hashtags: tags,
      warning:
        asset.asset_type !== "video"
          ? "Instagram Reels needs a public video URL for live Reel publishing. Image/media post publishing may still be possible when configured."
          : null,
      content: [
        `Stop scrolling — this property deserves a closer look. ✨`,
        "",
        `${description}`,
        "",
        `${leadCta}`,
        "",
        tags.map((tag) => `#${tag}`).join(" "),
      ].join("\n"),
    };
  }

  if (platform === "facebook") {
    const tags = uniqueTags([...baseTags, "home", "investment", "location"]);

    return {
      platform,
      title: `Facebook Video: ${title}`,
      hashtags: tags,
      warning:
        asset.asset_type !== "video"
          ? "Facebook Video needs a public video URL for live video publishing. Caption or image publishing can be configured separately."
          : null,
      content: [
        `${title}`,
        "",
        `${description}`,
        "",
        `Perfect for buyers and families comparing location, budget, and lifestyle fit.`,
        "",
        `${leadCta}`,
        "",
        tags.map((tag) => `#${tag}`).join(" "),
      ].join("\n"),
    };
  }

  const tags = uniqueTags([...baseTags, "propertyinvestment", "realestateindia", "growth"]);

  return {
    platform,
    title: `LinkedIn Campaign: ${title}`,
    hashtags: tags,
    warning:
      asset.asset_type === "video"
        ? "LinkedIn currently publishes the professional caption; native video upload can be added when LinkedIn media OAuth is ready."
        : null,
    content: [
      `${title}`,
      "",
      `${description}`,
      "",
      `From a ${goal.toLowerCase()} perspective, this campaign highlights the property's location advantage, buyer value, and enquiry readiness.`,
      "",
      `${leadCta}`,
      "",
      tags.map((tag) => `#${tag}`).join(" "),
    ].join("\n"),
  };
}

export function CampaignStudio({
  darkMode,
  socialAccounts,
  loadingSocialAccounts,
  onRefreshSocialAccounts,
  onDraftsChanged,
  onNavigate,
}: CampaignStudioProps) {
  const [sourceAsset, setSourceAsset] = useState<CampaignSourceAsset | null>(() =>
    readStoredAsset(),
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    ClientCampaignPublishPlatform[]
  >(platformOptions.map((platform) => platform.value));
  const [selectedDraftPlatforms, setSelectedDraftPlatforms] = useState<
    ClientCampaignPublishPlatform[]
  >(platformOptions.map((platform) => platform.value));
  const [goal, setGoal] = useState<CampaignGoal>("Generate leads");
  const [tone, setTone] = useState<CampaignTone>("Professional");
  const [drafts, setDrafts] = useState<CampaignDraft[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<CampaignActionResult[]>([]);
  const [actionLoading, setActionLoading] = useState<
    "generate" | "save" | "publish" | "schedule" | null
  >(null);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [confirmScheduleDisconnected, setConfirmScheduleDisconnected] =
    useState(false);

  useEffect(() => {
    const handleAssetSelected = (event: Event) => {
      const detail = (event as CustomEvent<CampaignSourceAsset>).detail;
      if (detail?.id && detail.title && detail.asset_type) {
        setSourceAsset(detail);
        setDrafts([]);
        setActionResults([]);
        setMessage(`Loaded "${detail.title}" from Media Library.`);
        setError(null);
      }
    };

    window.addEventListener("rs-campaign-asset-selected", handleAssetSelected);
    return () =>
      window.removeEventListener("rs-campaign-asset-selected", handleAssetSelected);
  }, []);

  const cardStyle = {
    background: darkMode ? "rgba(13, 13, 40, 0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
  };
  const panelStyle = {
    background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
    borderColor: darkMode ? "rgba(29,78,216,0.16)" : "rgba(15,23,42,0.08)",
  };
  const textPrimary = darkMode ? "#e2e8f0" : "#0f172a";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const textSoft = darkMode ? "#64748b" : "#94a3b8";

  const connectedPlatformSet = useMemo(() => {
    return new Set(
      platformOptions
        .map((platform) => platform.value)
        .filter((platform) =>
          socialAccounts.some((account) => isConnectedAccount(account, platform)),
        ),
    );
  }, [socialAccounts]);

  const selectedDraftSet = useMemo(
    () => new Set<ClientCampaignPublishPlatform>(selectedDraftPlatforms),
    [selectedDraftPlatforms],
  );

  const hasVideo = sourceAsset?.asset_type === "video";
  const selectedNeedsVideo = selectedPlatforms.some((platform) => needsVideo(platform));

  function togglePlatform(platform: ClientCampaignPublishPlatform) {
    setSelectedPlatforms((current) => {
      const next = current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform];

      setSelectedDraftPlatforms((selected) =>
        selected.filter((item) => next.includes(item)),
      );

      return next;
    });
  }

  function toggleDraftSelection(platform: ClientCampaignPublishPlatform) {
    setSelectedDraftPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }

  function handleGenerateDrafts() {
    if (!sourceAsset) {
      setError("Select an uploaded media asset from Media Library first.");
      return;
    }

    if (!selectedPlatforms.length) {
      setError("Select at least one platform.");
      return;
    }

    setActionLoading("generate");
    setError(null);
    setMessage(null);
    setActionResults([]);
    setConfirmScheduleDisconnected(false);

    const nextDrafts = selectedPlatforms.map((platform) =>
      buildDraft(sourceAsset, platform, goal, tone),
    );
    setDrafts(nextDrafts);
    setSelectedDraftPlatforms(selectedPlatforms);
    setMessage(`Generated ${nextDrafts.length} editable platform draft(s).`);
    setActionLoading(null);
  }

  function updateDraftContent(platform: ClientCampaignPublishPlatform, content: string) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.platform === platform ? { ...draft, content, savedPost: null } : draft,
      ),
    );
  }

  async function copyDraft(draft: CampaignDraft) {
    try {
      await navigator.clipboard.writeText(draft.content);
      setMessage(`${platformLabel(draft.platform)} draft copied.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy draft.");
    }
  }

  async function saveDraftsFor(platformsToSave: ClientCampaignPublishPlatform[]) {
    if (!sourceAsset) {
      throw new Error("Select an uploaded media asset from Media Library first.");
    }

    const nextDrafts = drafts.map((draft) => ({ ...draft }));
    const targetSet = new Set(platformsToSave);
    const results: CampaignActionResult[] = [];

    for (const draft of nextDrafts) {
      if (!targetSet.has(draft.platform)) continue;

      if (draft.savedPost) {
        results.push({
          platform: draft.platform,
          status: "saved",
          message: "Draft already saved.",
        });
        continue;
      }

      const created = await createGeneratedPost({
        title: draft.title,
        content: draft.content,
        platform: draft.platform as ClientGeneratedPostPlatform,
        status: "draft",
        property_id: sourceAsset.property_id || null,
        hashtags: draft.hashtags,
        media_asset_ids: isMediaAsset(sourceAsset) ? [sourceAsset.id] : [],
        metadata_json: {
          source: "ai_campaign_studio",
          source_asset_id: sourceAsset.id,
          source_asset_type: sourceAsset.asset_type,
          source_file_url: sourceAsset.file_url || null,
          source_file_name: sourceAsset.file_name || null,
          source_property_title: sourceAsset.property_title || null,
          target_platform: draft.platform,
          campaign_goal: goal,
          campaign_tone: tone,
          campaign_type: "one_click_multi_platform",
          requires_platform_credentials: true,
          warning: draft.warning || null,
        },
      });

      draft.savedPost = created;
      results.push({
        platform: draft.platform,
        status: "saved",
        message: "Draft saved to Generated Posts.",
      });
    }

    setDrafts(nextDrafts);
    await onDraftsChanged();
    return { drafts: nextDrafts, results };
  }

  async function handleSaveDrafts() {
    const platformsToSave = selectedDraftPlatforms.length
      ? selectedDraftPlatforms
      : drafts.map((draft) => draft.platform);

    if (!drafts.length) {
      setError("Generate platform drafts first.");
      return;
    }

    try {
      setActionLoading("save");
      setError(null);
      setMessage(null);
      const result = await saveDraftsFor(platformsToSave);
      setActionResults(result.results);
      setMessage("Selected platform drafts saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save drafts.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePublishSelected() {
    const platformsToPublish = selectedDraftPlatforms;

    if (!drafts.length) {
      setError("Generate platform drafts first.");
      return;
    }

    if (!platformsToPublish.length) {
      setError("Select at least one draft to publish.");
      return;
    }

    try {
      setActionLoading("publish");
      setError(null);
      setMessage(null);
      setActionResults([]);
      setConfirmScheduleDisconnected(false);

      const saveResult = await saveDraftsFor(platformsToPublish);
      const results: CampaignActionResult[] = [];

      for (const platform of platformsToPublish) {
        const draft = saveResult.drafts.find((item) => item.platform === platform);

        if (!draft?.savedPost) {
          results.push({
            platform,
            status: "failed",
            message: "Draft could not be saved before publishing.",
          });
          continue;
        }

        if (needsVideo(platform) && !hasVideo) {
          results.push({
            platform,
            status: "failed",
            message: "YouTube Shorts requires a video asset before publishing.",
          });
          continue;
        }

        if (!connectedPlatformSet.has(platform)) {
          results.push({
            platform,
            status: "not_connected",
            message: `${platformLabel(platform)} is not connected. Connect this account before publishing.`,
          });
          continue;
        }

        try {
          const published = await publishGeneratedPost(draft.savedPost.id, {
            platform: platform as ClientGeneratedPostPlatform,
            allow_mock_fallback: false,
          });
          const publisher =
            published.metadata_json?.publisher &&
            typeof published.metadata_json.publisher === "object"
              ? (published.metadata_json.publisher as Record<string, unknown>)
              : null;

          results.push({
            platform,
            status: "published",
            message: "Publish request completed through the connected account path.",
            externalUrl:
              typeof publisher?.external_post_url === "string"
                ? publisher.external_post_url
                : null,
          });
        } catch (err) {
          results.push({
            platform,
            status: "failed",
            message:
              err instanceof Error
                ? err.message
                : "Publishing failed for this platform.",
          });
        }
      }

      setActionResults(results);
      await onDraftsChanged();
      setMessage("Publish attempt completed. Review per-platform results below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish campaign.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleScheduleSelected() {
    const platformsToSchedule = selectedDraftPlatforms;

    if (!drafts.length) {
      setError("Generate platform drafts first.");
      return;
    }

    if (!platformsToSchedule.length) {
      setError("Select at least one draft to schedule.");
      return;
    }

    if (!scheduledDateTime) {
      setError("Choose a schedule date/time first.");
      return;
    }

    const scheduledDate = new Date(scheduledDateTime);

    if (Number.isNaN(scheduledDate.getTime())) {
      setError("Choose a valid schedule date/time.");
      return;
    }

    if (scheduledDate <= new Date()) {
      setError("Schedule date/time must be in the future.");
      return;
    }

    const disconnected = platformsToSchedule.filter(
      (platform) => !connectedPlatformSet.has(platform),
    );

    if (disconnected.length && !confirmScheduleDisconnected) {
      setConfirmScheduleDisconnected(true);
      setError(
        `${disconnected.map(platformLabel).join(", ")} not connected. Click Schedule Anyway to create Not Connected schedule records.`,
      );
      setActionResults(
        disconnected.map((platform) => ({
          platform,
          status: "not_connected",
          message: `${platformLabel(platform)} is not connected. It will be saved as Not Connected until credentials are added.`,
        })),
      );
      return;
    }

    try {
      setActionLoading("schedule");
      setError(null);
      setMessage(null);

      const saveResult = await saveDraftsFor(platformsToSchedule);
      const results: CampaignActionResult[] = [];

      for (const platform of platformsToSchedule) {
        const draft = saveResult.drafts.find((item) => item.platform === platform);

        if (!draft?.savedPost) {
          results.push({
            platform,
            status: "failed",
            message: "Draft could not be saved before scheduling.",
          });
          continue;
        }

        if (needsVideo(platform) && !hasVideo) {
          results.push({
            platform,
            status: "failed",
            message: "YouTube Shorts requires a video asset before scheduling.",
          });
          continue;
        }

        const connected = connectedPlatformSet.has(platform);
        const scheduleStatus: ClientScheduledPostStatus = connected
          ? "scheduled"
          : "not_connected";

        await createScheduledPost({
          generated_post_id: draft.savedPost.id,
          platform,
          status: scheduleStatus,
          scheduled_at: scheduledDate.toISOString(),
          failure_reason: connected
            ? undefined
            : `${platformLabel(platform)} is not connected. Connect this account before publishing.`,
          metadata_json: {
            source: "ai_campaign_studio",
            campaign_goal: goal,
            campaign_tone: tone,
            connection_status: connected ? "connected" : "not_connected",
            allow_mock_fallback: false,
            warning: connected
              ? draft.warning || null
              : `${platformLabel(platform)} is not connected. Connect this account before publishing.`,
          },
        });

        results.push({
          platform,
          status: scheduleStatus === "scheduled" ? "scheduled" : "not_connected",
          message: connected
            ? "Scheduled successfully."
            : "Scheduled as Not Connected. Connect the account before the publishing time.",
        });
      }

      setActionResults(results);
      setConfirmScheduleDisconnected(false);
      await onDraftsChanged();
      setMessage("Schedule action completed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule campaign.");
    } finally {
      setActionLoading(null);
    }
  }

  const sourceUrl = resolveAssetUrl(sourceAsset?.file_url);

  return (
    <section
      className="rounded-2xl border p-4"
      style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
      aria-labelledby="campaign-studio-heading"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: darkMode
                  ? "rgba(29,78,216,0.18)"
                  : "rgba(29,78,216,0.10)",
              }}
            >
              <Sparkles size={16} style={{ color: "#60A5FA" }} />
            </div>
            <div>
              <h2
                id="campaign-studio-heading"
                className="text-sm font-semibold"
                style={{ color: textPrimary }}
              >
                AI Campaign Studio
              </h2>
              <p className="text-xs" style={{ color: textSoft }}>
                Media Library → platform drafts → honest publish/schedule readiness.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefreshSocialAccounts}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
          style={{ borderColor: cardStyle.borderColor, color: textMuted }}
        >
          {loadingSocialAccounts ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          Refresh connections
        </button>
      </div>

      {!sourceAsset ? (
        <div
          className="rounded-2xl border p-5 text-center"
          style={panelStyle}
        >
          <Video size={24} className="mx-auto" style={{ color: "#1D4ED8" }} />
          <p className="mt-3 text-sm font-semibold" style={{ color: textPrimary }}>
            Select media to start a campaign
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5" style={{ color: textMuted }}>
            Open Media Library, choose an uploaded video/image/content asset, and click
            Create Multi-Platform Campaign. This keeps the source asset linked to
            each generated draft.
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.("media")}
            className="mt-4 rounded-xl px-4 py-2 text-xs font-semibold"
            style={{
              background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
              color: "#ffffff",
            }}
          >
            Open Media Library
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-2xl border p-3" style={panelStyle}>
              <div
                className="flex min-h-52 items-center justify-center overflow-hidden rounded-xl border"
                style={{
                  background: darkMode ? "rgba(2,6,23,0.48)" : "#ffffff",
                  borderColor: cardStyle.borderColor,
                }}
              >
                {sourceAsset.asset_type === "video" && sourceUrl ? (
                  <video src={sourceUrl} controls className="h-full max-h-72 w-full object-contain" />
                ) : sourceAsset.asset_type === "image" && sourceUrl ? (
                  <img src={sourceUrl} alt={sourceAsset.title} className="h-full max-h-72 w-full object-contain" />
                ) : (
                  <div className="p-6 text-center">
                    <Video size={26} className="mx-auto" style={{ color: textSoft }} />
                    <p className="mt-2 text-xs" style={{ color: textMuted }}>
                      Preview unavailable for this asset type.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                  {sourceAsset.title}
                </p>
                <p className="mt-1 text-xs capitalize" style={{ color: textMuted }}>
                  {sourceAsset.asset_type}
                  {sourceAsset.file_name ? ` · ${sourceAsset.file_name}` : ""}
                </p>
                {sourceAsset.property_title && (
                  <p className="mt-1 text-xs" style={{ color: textSoft }}>
                    Property: {sourceAsset.property_title}
                  </p>
                )}
                {sourceAsset.description && (
                  <p className="mt-2 line-clamp-3 text-xs leading-5" style={{ color: textMuted }}>
                    {sourceAsset.description}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={panelStyle}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs" style={{ color: textSoft }}>
                    Campaign goal
                  </label>
                  <select
                    value={goal}
                    onChange={(event) => setGoal(event.target.value as CampaignGoal)}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                      borderColor: cardStyle.borderColor,
                      color: textPrimary,
                    }}
                  >
                    {campaignGoals.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs" style={{ color: textSoft }}>
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(event) => setTone(event.target.value as CampaignTone)}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                      borderColor: cardStyle.borderColor,
                      color: textPrimary,
                    }}
                  >
                    {campaignTones.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold" style={{ color: textPrimary }}>
                  Platforms
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {platformOptions.map((platform) => {
                    const selected = selectedPlatforms.includes(platform.value);
                    const connected = connectedPlatformSet.has(platform.value);

                    return (
                      <label
                        key={platform.value}
                        className="rounded-2xl border p-3 transition-all"
                        style={{
                          background: selected
                            ? `${platform.color}12`
                            : darkMode
                              ? "rgba(255,255,255,0.025)"
                              : "#ffffff",
                          borderColor: selected ? `${platform.color}55` : cardStyle.borderColor,
                        }}
                      >
                        <span className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => togglePlatform(platform.value)}
                            className="mt-0.5 h-4 w-4 accent-indigo-500"
                          />
                          <span className="min-w-0">
                            <span
                              className="flex flex-wrap items-center gap-2 text-xs font-semibold"
                              style={{ color: textPrimary }}
                            >
                              {platform.label}
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px]"
                                style={{
                                  background: connected
                                    ? "rgba(16,185,129,0.12)"
                                    : "rgba(245,158,11,0.12)",
                                  color: connected ? "#10b981" : "#f59e0b",
                                }}
                              >
                                {connected ? "Connected" : "Not Connected"}
                              </span>
                            </span>
                            <span className="mt-1 block text-xs leading-4" style={{ color: textSoft }}>
                              {platform.description}
                            </span>
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {selectedNeedsVideo && !hasVideo && (
                <div
                  className="mt-4 flex items-start gap-3 rounded-2xl border p-3"
                  style={{
                    background: darkMode ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.07)",
                    borderColor: "rgba(245,158,11,0.24)",
                  }}
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
                  <p className="text-xs leading-5" style={{ color: textMuted }}>
                    YouTube Shorts requires a video asset. Generate drafts is still allowed,
                    but live publish/schedule for YouTube will fail until a video is linked.
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleGenerateDrafts}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
                    color: "#ffffff",
                  }}
                >
                  {actionLoading === "generate" ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  Generate Platform Drafts
                </button>
              </div>
            </div>
          </div>

          {(message || error) && (
            <div
              className="rounded-xl border px-3 py-2 text-xs"
              style={{
                background: error
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(16,185,129,0.08)",
                borderColor: error
                  ? "rgba(239,68,68,0.20)"
                  : "rgba(16,185,129,0.20)",
                color: error ? "#ef4444" : "#10b981",
              }}
            >
              {error || message}
            </div>
          )}

          {drafts.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-end sm:justify-between" style={panelStyle}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                    Platform Drafts
                  </p>
                  <p className="mt-1 text-xs" style={{ color: textMuted }}>
                    Edit copy before saving, publishing, or scheduling selected drafts.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(event) => {
                      setScheduledDateTime(event.target.value);
                      setConfirmScheduleDisconnected(false);
                    }}
                    className="rounded-xl border px-3 py-2 text-xs outline-none"
                    style={{
                      background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                      borderColor: cardStyle.borderColor,
                      color: textPrimary,
                    }}
                    aria-label="Schedule date and time"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDrafts}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium disabled:opacity-60"
                    style={{ borderColor: cardStyle.borderColor, color: textMuted }}
                  >
                    {actionLoading === "save" && <Loader2 size={12} className="animate-spin" />}
                    Save Drafts
                  </button>
                  <button
                    type="button"
                    onClick={handleScheduleSelected}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium disabled:opacity-60"
                    style={{ borderColor: cardStyle.borderColor, color: textMuted }}
                  >
                    {actionLoading === "schedule" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CalendarClock size={12} />
                    )}
                    {confirmScheduleDisconnected ? "Schedule Anyway" : "Schedule Selected"}
                  </button>
                  <button
                    type="button"
                    onClick={handlePublishSelected}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
                      color: "#ffffff",
                    }}
                  >
                    {actionLoading === "publish" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    Publish Selected
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {drafts.map((draft) => {
                  const connected = connectedPlatformSet.has(draft.platform);
                  const selected = selectedDraftSet.has(draft.platform);
                  const color = platformColor(draft.platform);

                  return (
                    <article
                      key={draft.platform}
                      className="rounded-2xl border p-4"
                      style={{
                        background: darkMode ? "rgba(255,255,255,0.025)" : "#ffffff",
                        borderColor: selected ? `${color}55` : cardStyle.borderColor,
                      }}
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleDraftSelection(draft.platform)}
                          className="h-4 w-4 accent-indigo-500"
                          aria-label={`Select ${platformLabel(draft.platform)} draft`}
                        />
                        <span className="text-sm font-semibold" style={{ color: textPrimary }}>
                          {platformLabel(draft.platform)}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px]"
                          style={{
                            background: connected
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(245,158,11,0.12)",
                            color: connected ? "#10b981" : "#f59e0b",
                          }}
                        >
                          {connected ? "Connected" : "Not Connected"}
                        </span>
                        {draft.savedPost && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px]"
                            style={{
                              background: "rgba(29,78,216,0.12)",
                              color: "#60A5FA",
                            }}
                          >
                            Saved
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => void copyDraft(draft)}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px]"
                          style={{ borderColor: cardStyle.borderColor, color: textSoft }}
                        >
                          <Copy size={11} />
                          Copy
                        </button>
                      </div>

                      <input
                        value={draft.title}
                        onChange={(event) =>
                          setDrafts((current) =>
                            current.map((item) =>
                              item.platform === draft.platform
                                ? { ...item, title: event.target.value, savedPost: null }
                                : item,
                            ),
                          )
                        }
                        className="mb-2 w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none"
                        style={{
                          background: darkMode ? "rgba(255,255,255,0.04)" : "#f8fafc",
                          borderColor: cardStyle.borderColor,
                          color: textPrimary,
                        }}
                      />

                      <textarea
                        value={draft.content}
                        onChange={(event) => updateDraftContent(draft.platform, event.target.value)}
                        rows={9}
                        className="w-full resize-none rounded-xl border px-3 py-2 text-xs leading-5 outline-none"
                        style={{
                          background: darkMode ? "rgba(255,255,255,0.04)" : "#f8fafc",
                          borderColor: cardStyle.borderColor,
                          color: textPrimary,
                        }}
                      />

                      {draft.warning && (
                        <p className="mt-2 text-xs leading-5" style={{ color: "#f59e0b" }}>
                          {draft.warning}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {actionResults.length > 0 && (
            <div className="rounded-2xl border p-4" style={panelStyle}>
              <p className="mb-3 text-sm font-semibold" style={{ color: textPrimary }}>
                Campaign action results
              </p>
              <div className="space-y-2">
                {actionResults.map((result) => {
                  const success = ["saved", "scheduled", "published"].includes(result.status);
                  const warning = result.status === "not_connected";
                  const color = success ? "#10b981" : warning ? "#f59e0b" : "#ef4444";

                  return (
                    <div
                      key={`${result.platform}-${result.status}`}
                      className="rounded-xl border p-3"
                      style={{
                        background: darkMode ? "rgba(255,255,255,0.025)" : "#ffffff",
                        borderColor: cardStyle.borderColor,
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {success ? (
                          <CheckCircle2 size={14} style={{ color }} />
                        ) : (
                          <AlertTriangle size={14} style={{ color }} />
                        )}
                        <span className="text-xs font-semibold" style={{ color: textPrimary }}>
                          {platformLabel(result.platform)}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide"
                          style={{ background: `${color}14`, color }}
                        >
                          {result.status.replace("_", " ")}
                        </span>
                        {result.externalUrl && (
                          <a
                            href={result.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto inline-flex items-center gap-1 text-xs font-medium"
                            style={{ color: "#1D4ED8" }}
                          >
                            Open post
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-5" style={{ color: textMuted }}>
                        {result.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
