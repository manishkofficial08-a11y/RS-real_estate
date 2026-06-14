export default function CubeLogo() {
  return (
    <div className="cube-scene" style={{ width: 40, height: 40, perspective: 120, flexShrink: 0 }}>
      <div
        className="cube"
        style={{
          width: 40,
          height: 40,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: 'translateZ(-20px)',
          transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1)',
          animation: 'cubeIntro 2.5s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        }}
      >
        <div
          className="cube__face cube__face--front"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotateY(0deg) translateZ(20px)',
            background: 'linear-gradient(135deg, #6B8AFF, #4A6BFF)',
          }}
        >
          <span style={{ color: '#F0EDE6', fontSize: '1.25rem', fontWeight: 600 }}>A</span>
        </div>
        <div
          className="cube__face cube__face--right"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotateY(90deg) translateZ(20px)',
            background: 'linear-gradient(135deg, #5A7AEE, #3A5BEE)',
          }}
        />
        <div
          className="cube__face cube__face--back"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotateY(180deg) translateZ(20px)',
            background: 'linear-gradient(135deg, #4A6BDD, #2A4BDD)',
          }}
        />
        <div
          className="cube__face cube__face--left"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotateY(-90deg) translateZ(20px)',
            background: 'linear-gradient(135deg, #5A7AEE, #3A5BEE)',
          }}
        />
        <div
          className="cube__face cube__face--top"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotateX(90deg) translateZ(20px)',
            background: 'linear-gradient(135deg, #7B9AFF, #5B7BFF)',
          }}
        />
        <div
          className="cube__face cube__face--bottom"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotateX(-90deg) translateZ(20px)',
            background: 'linear-gradient(135deg, #3A5BDD, #1A3BDD)',
          }}
        />
      </div>
    </div>
  );
}

