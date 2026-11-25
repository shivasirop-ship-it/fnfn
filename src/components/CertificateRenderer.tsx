import { CertificateRecord } from '../types';

interface CertificateRendererProps {
  certificate: CertificateRecord;
  className?: string;
}

function SealGraphic({
  style,
  initials,
  caption,
  color,
  textColor,
}: {
  style: CertificateRecord['sealStyle'];
  initials: string;
  caption: string;
  color: string;
  textColor: string;
}) {
  if (style === 'none') return null;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        className="relative flex items-center justify-center"
        style={{ width: '9.2cqw', height: '9.2cqw' }}
      >
        {style === 'gold-foil' && (
          <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-md">
            <defs>
              <radialGradient id="sealFoil" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fff7cc" stopOpacity="0.95" />
                <stop offset="45%" stopColor={color} stopOpacity="0.92" />
                <stop offset="100%" stopColor={color} stopOpacity="0.55" />
              </radialGradient>
            </defs>
            {/* Scalloped outer rim */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />
            <circle
              cx="60"
              cy="60"
              r="47"
              fill="url(#sealFoil)"
              fillOpacity="0.22"
              stroke={color}
              strokeWidth="2.2"
            />
            <circle
              cx="60"
              cy="60"
              r="38"
              fill="none"
              stroke={color}
              strokeWidth="1.1"
            />
            <polygon
              points="60,12 63,20 71,20 65,25 67,33 60,28 53,33 55,25 49,20 57,20"
              fill={color}
              opacity="0.85"
            />
          </svg>
        )}

        {style === 'wax-stamp' && (
          <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-md">
            <path
              d="M60 7 C71 7 76 14 86 14 C96 14 103 22 106 32 C110 42 114 48 113 60 C112 72 106 78 103 88 C99 98 90 105 80 107 C70 110 66 114 57 113 C47 112 41 108 32 104 C22 100 14 91 12 81 C10 71 6 65 8 54 C10 43 14 37 17 28 C21 19 30 13 40 11 C49 9 52 7 60 7 Z"
              fill={color}
              fillOpacity="0.88"
              stroke="#ffffff"
              strokeOpacity="0.25"
              strokeWidth="1.5"
            />
            <circle
              cx="60"
              cy="60"
              r="37"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.4"
              strokeWidth="1.6"
            />
            <circle
              cx="60"
              cy="60"
              r="31"
              fill="none"
              stroke="#000000"
              strokeOpacity="0.28"
              strokeWidth="1.2"
            />
          </svg>
        )}

        {style === 'laurel-wreath' && (
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <circle
              cx="60"
              cy="60"
              r="42"
              fill={color}
              fillOpacity="0.1"
              stroke={color}
              strokeWidth="1.5"
            />
            <path
              d="M32 88 C18 72 18 44 34 26 M88 88 C102 72 102 44 86 26"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M28 76 C22 68 23 58 29 52 M26 60 C21 50 24 40 31 35 M92 76 C98 68 97 58 91 52 M94 60 C99 50 96 40 89 35"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M44 96 Q60 104 76 96"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
          </svg>
        )}

        {style === 'crown-crest' && (
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <polygon
              points="60,8 106,34 106,86 60,112 14,86 14,34"
              fill={color}
              fillOpacity="0.12"
              stroke={color}
              strokeWidth="2"
            />
            <polygon
              points="60,16 98,38 98,82 60,104 22,82 22,38"
              fill="none"
              stroke={color}
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <path
              d="M40 42 L46 28 L60 36 L74 28 L80 42 Z"
              fill={color}
              fillOpacity="0.85"
            />
          </svg>
        )}

        {style === 'minimal-monogram' && (
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <rect
              x="16"
              y="16"
              width="88"
              height="88"
              rx="44"
              fill="none"
              stroke={color}
              strokeWidth="1.8"
            />
            <rect
              x="23"
              y="23"
              width="74"
              height="74"
              rx="37"
              fill="none"
              stroke={color}
              strokeWidth="0.9"
              strokeDasharray="3 3"
            />
          </svg>
        )}

        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{
            color: style === 'wax-stamp' ? '#fff7ed' : textColor,
            paddingTop: style === 'crown-crest' ? '1.2cqw' : '0',
          }}
        >
          <span
            className="font-bold tracking-[0.14em]"
            style={{
              fontSize: '1.75cqw',
              fontFamily: '"Cinzel", Georgia, serif',
              lineHeight: 1.1,
            }}
          >
            {initials || 'DQR'}
          </span>
        </div>
      </div>

      {caption && (
        <span
          className="mt-1 tracking-[0.22em] uppercase"
          style={{
            fontSize: '0.88cqw',
            color,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
}

function BorderOverlay({
  style,
  borderColor,
  accentColor,
}: {
  style: CertificateRecord['borderStyle'];
  borderColor: string;
  accentColor: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Outer Frame */}
      <div
        className="absolute"
        style={{
          inset: '2.2%',
          border: `2px solid ${borderColor}`,
          opacity: 0.9,
        }}
      />

      {/* Inner Frame depending on style */}
      {style === 'imperial-double' && (
        <>
          <div
            className="absolute"
            style={{
              inset: '3.6%',
              border: `1px solid ${accentColor}`,
              opacity: 0.65,
            }}
          />
          <div
            className="absolute"
            style={{
              inset: '4.4%',
              border: `0.5px solid ${borderColor}`,
              opacity: 0.35,
            }}
          />
        </>
      )}

      {style === 'ornate-filigree' && (
        <>
          <div
            className="absolute"
            style={{
              inset: '3.8%',
              border: `1.5px solid ${borderColor}`,
              opacity: 0.72,
            }}
          />
          {/* Corner Filigree SVGs */}
          {[
            'top-[2.2%] left-[2.2%]',
            'top-[2.2%] right-[2.2%] scale-x-[-1]',
            'bottom-[2.2%] left-[2.2%] scale-y-[-1]',
            'bottom-[2.2%] right-[2.2%] scale-[-1]',
          ].map((pos, i) => (
            <svg
              key={i}
              viewBox="0 0 80 80"
              className={`absolute ${pos}`}
              style={{ width: '6.8cqw', height: '6.8cqw' }}
            >
              <path
                d="M4 4 L48 4 C34 12 28 18 22 28 C16 38 10 44 4 52 Z"
                fill="none"
                stroke={borderColor}
                strokeWidth="2"
              />
              <path
                d="M10 10 C28 10 34 18 34 32 M10 10 C10 28 18 34 32 34"
                fill="none"
                stroke={accentColor}
                strokeWidth="1.5"
              />
              <circle cx="14" cy="14" r="3" fill={borderColor} />
            </svg>
          ))}
        </>
      )}

      {style === 'architectural-hairline' && (
        <div
          className="absolute"
          style={{
            inset: '4%',
            border: `0.75px solid ${borderColor}`,
            opacity: 0.45,
          }}
        />
      )}

      {style === 'art-deco' && (
        <>
          <div
            className="absolute"
            style={{
              inset: '3.6%',
              border: `1.5px solid ${accentColor}`,
              opacity: 0.75,
            }}
          />
          {[
            'top-[2.2%] left-[2.2%]',
            'top-[2.2%] right-[2.2%] scale-x-[-1]',
            'bottom-[2.2%] left-[2.2%] scale-y-[-1]',
            'bottom-[2.2%] right-[2.2%] scale-[-1]',
          ].map((pos, i) => (
            <svg
              key={i}
              viewBox="0 0 64 64"
              className={`absolute ${pos}`}
              style={{ width: '5.5cqw', height: '5.5cqw' }}
            >
              <polyline
                points="2,42 2,2 42,2"
                fill="none"
                stroke={borderColor}
                strokeWidth="4"
              />
              <polyline
                points="12,34 12,12 34,12"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
              />
              <rect x="2" y="2" width="10" height="10" fill={borderColor} />
            </svg>
          ))}
        </>
      )}

      {style === 'royal-crest' && (
        <>
          <div
            className="absolute"
            style={{
              inset: '3.5%',
              border: `2px double ${borderColor}`,
              opacity: 0.75,
            }}
          />
          <div
            className="absolute left-1/2 top-[1.2%] -translate-x-1/2 px-3"
            style={{ color: borderColor, fontSize: '2cqw' }}
          >
            ♛
          </div>
          <div
            className="absolute bottom-[1.2%] left-1/2 -translate-x-1/2 px-3"
            style={{ color: borderColor, fontSize: '1.4cqw' }}
          >
            ❖
          </div>
        </>
      )}

      {style === 'parchment-framed' && (
        <div
          className="absolute"
          style={{
            inset: '4.2%',
            border: `1px dashed ${borderColor}`,
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
}

export function CertificateRenderer({
  certificate: cert,
  className = '',
}: CertificateRendererProps) {
  const { palette, typography, signature } = cert;

  return (
    <div
      className={`relative w-full overflow-hidden shadow-[0_22px_70px_rgba(0,0,0,0.6)] ${className}`}
      style={{
        aspectRatio: '2000 / 1414',
        containerType: 'inline-size',
        background: `radial-gradient(circle at 50% 24%, ${palette.bgSecondary} 0%, ${palette.bgPrimary} 78%)`,
        color: palette.textColor,
      }}
    >
      {/* Subtle atmospheric glow & guilloche center */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 45%, ${palette.accentColor}26 0%, transparent 58%)`,
        }}
      />

      <BorderOverlay
        style={cert.borderStyle}
        borderColor={palette.borderColor}
        accentColor={palette.accentColor}
      />

      {/* Inner Safe Content Area */}
      <div
        className="relative z-10 flex h-full w-full flex-col justify-between text-center"
        style={{ padding: '6.8% 8.8% 6.2%' }}
      >
        {/* TOP: Institution + Ribbon */}
        <div className="flex flex-col items-center">
          <p
            className="font-semibold tracking-[0.28em] uppercase"
            style={{
              fontFamily: typography.metaFont,
              color: palette.accentColor,
              fontSize: '1.18cqw',
            }}
          >
            {cert.institutionText}
          </p>

          {cert.ribbonText && (
            <div
              className="mt-[1.1cqw] inline-flex items-center gap-[1.1cqw] border-y px-[2.2cqw] py-[0.35cqw]"
              style={{
                borderColor: `${palette.borderColor}66`,
              }}
            >
              <span
                style={{ color: palette.borderColor, fontSize: '0.9cqw' }}
              >
                ✦
              </span>
              <span
                className="font-semibold tracking-[0.24em] uppercase"
                style={{
                  fontFamily: typography.metaFont,
                  color: palette.titleColor,
                  fontSize: '1.02cqw',
                }}
              >
                {cert.ribbonText}
              </span>
              <span
                style={{ color: palette.borderColor, fontSize: '0.9cqw' }}
              >
                ✦
              </span>
            </div>
          )}
        </div>

        {/* CENTER: Title, Subtitle, Recipient, Citation, Achievement */}
        <div className="my-auto flex flex-col items-center">
          <h2
            className="font-bold leading-[1.12] tracking-tight"
            style={{
              fontFamily: typography.titleFont,
              color: palette.titleColor,
              fontSize: `${3.95 * typography.titleScale}cqw`,
              textTransform: typography.uppercaseTitle ? 'uppercase' : 'none',
              letterSpacing: typography.uppercaseTitle ? '0.07em' : '0.01em',
            }}
          >
            {cert.titleText}
          </h2>

          <p
            className="mt-[1.4cqw] tracking-[0.22em] uppercase"
            style={{
              fontFamily: typography.metaFont,
              color: palette.textColor,
              opacity: 0.78,
              fontSize: '1.05cqw',
            }}
          >
            {cert.subtitleText}
          </p>

          {/* Recipient Name + ornamental rule */}
          <div className="mt-[1.1cqw] flex flex-col items-center">
            <p
              className="leading-[1.1] font-semibold"
              style={{
                fontFamily: typography.recipientFont,
                color: palette.recipientColor,
                fontSize: `${5.15 * typography.recipientScale}cqw`,
              }}
            >
              {cert.recipientName}
            </p>
            <div
              className="mt-[0.75cqw] h-[1.5px]"
              style={{
                width: '38cqw',
                background: `linear-gradient(90deg, transparent, ${palette.borderColor}, transparent)`,
              }}
            />
          </div>

          {/* Citation Body */}
          <p
            className="mt-[1.5cqw] max-w-[74cqw] leading-[1.55]"
            style={{
              fontFamily: typography.bodyFont,
              color: palette.textColor,
              fontSize: `${1.65 * typography.bodyScale}cqw`,
            }}
          >
            {cert.bodyText}
          </p>

          {/* Achievement Callout */}
          {cert.achievementText && (
            <div
              className="mt-[1.5cqw] inline-flex items-center gap-[0.8cqw] rounded-sm border px-[2cqw] py-[0.45cqw]"
              style={{
                borderColor: `${palette.borderColor}70`,
                backgroundColor: `${palette.borderColor}14`,
              }}
            >
              <span
                className="font-semibold tracking-[0.1em]"
                style={{
                  fontFamily: typography.metaFont,
                  color: palette.accentColor,
                  fontSize: '1.18cqw',
                }}
              >
                {cert.achievementText}
              </span>
            </div>
          )}
        </div>

        {/* BOTTOM LEDGER: Meta/Secondary Signatory + Seal + Digital Signature */}
        <div className="grid grid-cols-12 items-end gap-2 pt-[1cqw]">
          {/* Left Column: Date/Serial OR Secondary Signature */}
          <div className="col-span-4 flex flex-col items-center text-center">
            {signature.enabled && signature.secondaryEnabled ? (
              <div className="flex w-full max-w-[23cqw] flex-col items-center">
                <div
                  className="flex min-h-[4.2cqw] items-end justify-center pb-[0.3cqw]"
                  style={{
                    fontFamily: signature.signatureFont,
                    color: signature.signatureColor,
                    fontSize: '2.7cqw',
                    transform: 'rotate(-1.5deg)',
                  }}
                >
                  {signature.secondarySignatureText || 'Verified'}
                </div>
                <div
                  className="h-[1px] w-full"
                  style={{ backgroundColor: `${palette.borderColor}88` }}
                />
                <p
                  className="mt-[0.45cqw] font-semibold"
                  style={{
                    fontFamily: typography.bodyFont,
                    color: palette.titleColor,
                    fontSize: '1.18cqw',
                  }}
                >
                  {signature.secondarySignatoryName}
                </p>
                <p
                  className="tracking-[0.12em] uppercase opacity-75"
                  style={{
                    fontFamily: typography.metaFont,
                    color: palette.textColor,
                    fontSize: '0.86cqw',
                  }}
                >
                  {signature.secondarySignatoryRole}
                </p>
                <p
                  className="mt-[0.55cqw] tracking-[0.14em] uppercase opacity-70"
                  style={{
                    fontFamily: typography.metaFont,
                    color: palette.accentColor,
                    fontSize: '0.84cqw',
                  }}
                >
                  {cert.dateText} · {cert.serialText}
                </p>
              </div>
            ) : (
              <div className="flex w-full max-w-[23cqw] flex-col items-center">
                <p
                  className="pb-[0.35cqw] font-medium"
                  style={{
                    fontFamily: typography.bodyFont,
                    color: palette.titleColor,
                    fontSize: '1.35cqw',
                  }}
                >
                  {cert.dateText}
                </p>
                <div
                  className="h-[1px] w-full"
                  style={{ backgroundColor: `${palette.borderColor}88` }}
                />
                <p
                  className="mt-[0.45cqw] tracking-[0.16em] uppercase opacity-80"
                  style={{
                    fontFamily: typography.metaFont,
                    color: palette.textColor,
                    fontSize: '0.9cqw',
                  }}
                >
                  DATE ISSUED
                </p>
                {cert.serialText && (
                  <p
                    className="mt-[0.25cqw] tracking-[0.14em] uppercase opacity-70"
                    style={{
                      fontFamily: typography.metaFont,
                      color: palette.accentColor,
                      fontSize: '0.86cqw',
                    }}
                  >
                    {cert.serialText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Center Column: Official Seal */}
          <div className="col-span-4 flex flex-col items-center justify-end">
            <SealGraphic
              style={cert.sealStyle}
              initials={cert.sealInitials}
              caption={cert.sealCaption}
              color={palette.sealColor}
              textColor={palette.titleColor}
            />
          </div>

          {/* Right Column: Primary Digital Signature */}
          <div className="col-span-4 flex flex-col items-center text-center">
            {signature.enabled && signature.mode !== 'none' ? (
              <div className="flex w-full max-w-[23cqw] flex-col items-center">
                <div className="flex min-h-[4.6cqw] w-full items-end justify-center pb-[0.25cqw]">
                  {signature.mode === 'drawn' && signature.drawnDataUrl ? (
                    <img
                      src={signature.drawnDataUrl}
                      alt="Digital Signature"
                      className="max-h-[4.4cqw] max-w-full object-contain"
                    />
                  ) : (
                    <span
                      className="leading-none select-none"
                      style={{
                        fontFamily: signature.signatureFont,
                        color: signature.signatureColor,
                        fontSize: '3.2cqw',
                        transform: 'rotate(-2deg)',
                      }}
                    >
                      {signature.signatureText || 'Dijan'}
                    </span>
                  )}
                </div>
                <div
                  className="h-[1px] w-full"
                  style={{ backgroundColor: `${palette.borderColor}88` }}
                />
                <p
                  className="mt-[0.45cqw] font-semibold"
                  style={{
                    fontFamily: typography.bodyFont,
                    color: palette.titleColor,
                    fontSize: '1.22cqw',
                  }}
                >
                  {signature.signatoryName}
                </p>
                <p
                  className="tracking-[0.12em] uppercase opacity-75"
                  style={{
                    fontFamily: typography.metaFont,
                    color: palette.textColor,
                    fontSize: '0.86cqw',
                  }}
                >
                  {signature.signatoryRole}
                </p>
              </div>
            ) : (
              <div className="flex w-full max-w-[23cqw] flex-col items-center">
                <p
                  className="pb-[0.35cqw] font-medium"
                  style={{
                    fontFamily: typography.metaFont,
                    color: palette.accentColor,
                    fontSize: '1.1cqw',
                  }}
                >
                  {cert.serialText || 'DQR ARCHIVE'}
                </p>
                <div
                  className="h-[1px] w-full"
                  style={{ backgroundColor: `${palette.borderColor}88` }}
                />
                <p
                  className="mt-[0.45cqw] tracking-[0.16em] uppercase opacity-80"
                  style={{
                    fontFamily: typography.metaFont,
                    color: palette.textColor,
                    fontSize: '0.9cqw',
                  }}
                >
                  VERIFIED LEDGER
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function exportCertificateToPng(cert: CertificateRecord) {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const W = 2000;
  const H = 1414;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { palette, typography, signature } = cert;

  // 1. Background radial gradient
  const bgGrad = ctx.createRadialGradient(W / 2, H * 0.25, 60, W / 2, H * 0.45, W * 0.72);
  bgGrad.addColorStop(0, palette.bgSecondary);
  bgGrad.addColorStop(1, palette.bgPrimary);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle highlight halo
  const halo = ctx.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, W * 0.48);
  halo.addColorStop(0, `${palette.accentColor}22`);
  halo.addColorStop(1, 'transparent');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // 2. Borders
  const pad1 = 44;
  const pad2 = 72;
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(pad1, pad1, W - pad1 * 2, H - pad1 * 2);

  ctx.save();
  ctx.strokeStyle = palette.accentColor;
  ctx.lineWidth = cert.borderStyle === 'architectural-hairline' ? 1.5 : 2;
  ctx.globalAlpha = 0.68;
  if (cert.borderStyle === 'parchment-framed') {
    ctx.setLineDash([12, 10]);
  }
  ctx.strokeRect(pad2, pad2, W - pad2 * 2, H - pad2 * 2);
  ctx.restore();

  // Corner motifs for ornate / art-deco / imperial
  if (cert.borderStyle === 'art-deco' || cert.borderStyle === 'ornate-filigree') {
    const corners = [
      [pad1, pad1, 1, 1],
      [W - pad1, pad1, -1, 1],
      [pad1, H - pad1, 1, -1],
      [W - pad1, H - pad1, -1, -1],
    ];
    for (const [cx, cy, sx, sy] of corners) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sx, sy);
      ctx.strokeStyle = palette.borderColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 74);
      ctx.lineTo(0, 0);
      ctx.lineTo(74, 0);
      ctx.stroke();
      ctx.fillStyle = palette.borderColor;
      ctx.fillRect(0, 0, 18, 18);
      ctx.restore();
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 3. Institution Header
  ctx.fillStyle = palette.accentColor;
  ctx.font = `600 24px ${typography.metaFont}`;
  ctx.fillText(cert.institutionText.toUpperCase(), W / 2, 138);

  // Ribbon Banner
  if (cert.ribbonText) {
    ctx.font = `600 21px ${typography.metaFont}`;
    const ribText = `✦   ${cert.ribbonText.toUpperCase()}   ✦`;
    const mWidth = ctx.measureText(ribText).width + 80;
    ctx.strokeStyle = `${palette.borderColor}77`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - mWidth / 2, 180);
    ctx.lineTo(W / 2 + mWidth / 2, 180);
    ctx.moveTo(W / 2 - mWidth / 2, 224);
    ctx.lineTo(W / 2 + mWidth / 2, 224);
    ctx.stroke();

    ctx.fillStyle = palette.titleColor;
    ctx.fillText(ribText, W / 2, 203);
  }

  // 4. Title
  const titleStr = typography.uppercaseTitle
    ? cert.titleText.toUpperCase()
    : cert.titleText;
  ctx.fillStyle = palette.titleColor;
  ctx.font = `700 ${Math.round(78 * typography.titleScale)}px ${typography.titleFont}`;
  ctx.fillText(titleStr, W / 2, 345, W - 260);

  // 5. Subtitle
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = palette.textColor;
  ctx.font = `500 21px ${typography.metaFont}`;
  ctx.fillText(cert.subtitleText.toUpperCase(), W / 2, 435);
  ctx.restore();

  // 6. Recipient Name + flourish rule
  ctx.fillStyle = palette.recipientColor;
  ctx.font = `600 ${Math.round(104 * typography.recipientScale)}px ${typography.recipientFont}`;
  ctx.fillText(cert.recipientName, W / 2, 540, W - 280);

  const ruleGrad = ctx.createLinearGradient(W / 2 - 380, 0, W / 2 + 380, 0);
  ruleGrad.addColorStop(0, 'transparent');
  ruleGrad.addColorStop(0.5, palette.borderColor);
  ruleGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = ruleGrad;
  ctx.fillRect(W / 2 - 380, 616, 760, 3);

  // 7. Body Citation
  ctx.fillStyle = palette.textColor;
  ctx.font = `400 ${Math.round(33 * typography.bodyScale)}px ${typography.bodyFont}`;
  const bodyLines = wrapTextLines(ctx, cert.bodyText, 1420);
  bodyLines.slice(0, 4).forEach((line, idx) => {
    ctx.fillText(line, W / 2, 690 + idx * 48);
  });

  // 8. Achievement Pill Box
  if (cert.achievementText) {
    const achY = 690 + Math.min(4, bodyLines.length) * 48 + 42;
    ctx.font = `600 24px ${typography.metaFont}`;
    const achW = Math.min(1300, ctx.measureText(cert.achievementText).width + 88);
    ctx.fillStyle = `${palette.borderColor}1c`;
    ctx.strokeStyle = `${palette.borderColor}88`;
    ctx.lineWidth = 2;
    ctx.fillRect(W / 2 - achW / 2, achY - 26, achW, 52);
    ctx.strokeRect(W / 2 - achW / 2, achY - 26, achW, 52);

    ctx.fillStyle = palette.accentColor;
    ctx.fillText(cert.achievementText, W / 2, achY + 1);
  }

  // 9. Bottom Ledger
  const footerLineY = 1210;

  // Left: Date / Secondary Signature
  const leftCenterX = 410;
  if (signature.enabled && signature.secondaryEnabled) {
    ctx.save();
    ctx.translate(leftCenterX, footerLineY - 46);
    ctx.rotate(-0.025);
    ctx.fillStyle = signature.signatureColor;
    ctx.font = `400 54px ${signature.signatureFont}`;
    ctx.fillText(signature.secondarySignatureText || 'Verified', 0, 0);
    ctx.restore();

    ctx.fillStyle = `${palette.borderColor}88`;
    ctx.fillRect(leftCenterX - 210, footerLineY, 420, 2);
    ctx.fillStyle = palette.titleColor;
    ctx.font = `600 23px ${typography.bodyFont}`;
    ctx.fillText(signature.secondarySignatoryName, leftCenterX, footerLineY + 34);
    ctx.fillStyle = palette.textColor;
    ctx.font = `500 17px ${typography.metaFont}`;
    ctx.fillText(signature.secondarySignatoryRole.toUpperCase(), leftCenterX, footerLineY + 64);
    ctx.fillStyle = palette.accentColor;
    ctx.fillText(`${cert.dateText} · ${cert.serialText}`, leftCenterX, footerLineY + 94);
  } else {
    ctx.fillStyle = palette.titleColor;
    ctx.font = `600 26px ${typography.bodyFont}`;
    ctx.fillText(cert.dateText, leftCenterX, footerLineY - 28);
    ctx.fillStyle = `${palette.borderColor}88`;
    ctx.fillRect(leftCenterX - 210, footerLineY, 420, 2);
    ctx.fillStyle = palette.textColor;
    ctx.font = `500 18px ${typography.metaFont}`;
    ctx.fillText('DATE ISSUED', leftCenterX, footerLineY + 34);
    if (cert.serialText) {
      ctx.fillStyle = palette.accentColor;
      ctx.font = `500 17px ${typography.metaFont}`;
      ctx.fillText(cert.serialText, leftCenterX, footerLineY + 64);
    }
  }

  // Center: Seal
  if (cert.sealStyle !== 'none') {
    const sealX = W / 2;
    const sealY = 1178;
    ctx.save();
    ctx.strokeStyle = palette.sealColor;
    ctx.fillStyle =
      cert.sealStyle === 'wax-stamp'
        ? palette.sealColor
        : `${palette.sealColor}2a`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 82, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sealX, sealY, 68, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle =
      cert.sealStyle === 'wax-stamp' ? '#fff7ed' : palette.titleColor;
    ctx.font = `700 34px "Cinzel", Georgia, serif`;
    ctx.fillText(cert.sealInitials || 'DQR', sealX, sealY + 2);

    if (cert.sealCaption) {
      ctx.fillStyle = palette.sealColor;
      ctx.font = `600 17px ${typography.metaFont}`;
      ctx.fillText(cert.sealCaption.toUpperCase(), sealX, sealY + 110);
    }
    ctx.restore();
  }

  // Right: Primary Digital Signature
  const rightCenterX = W - 410;
  if (signature.enabled && signature.mode !== 'none') {
    if (signature.mode === 'drawn' && signature.drawnDataUrl) {
      try {
        const sigImg = await loadImage(signature.drawnDataUrl);
        const ratio = Math.min(340 / sigImg.width, 96 / sigImg.height);
        const dw = sigImg.width * ratio;
        const dh = sigImg.height * ratio;
        ctx.drawImage(
          sigImg,
          rightCenterX - dw / 2,
          footerLineY - dh - 10,
          dw,
          dh
        );
      } catch {
        // Fallback to text signature if drawn URL fails
        ctx.fillStyle = signature.signatureColor;
        ctx.font = `400 62px ${signature.signatureFont}`;
        ctx.fillText(signature.signatureText || 'Dijan', rightCenterX, footerLineY - 42);
      }
    } else {
      ctx.save();
      ctx.translate(rightCenterX, footerLineY - 46);
      ctx.rotate(-0.03);
      ctx.fillStyle = signature.signatureColor;
      ctx.font = `400 66px ${signature.signatureFont}`;
      ctx.fillText(signature.signatureText || 'Dijan', 0, 0);
      ctx.restore();
    }

    ctx.fillStyle = `${palette.borderColor}88`;
    ctx.fillRect(rightCenterX - 210, footerLineY, 420, 2);
    ctx.fillStyle = palette.titleColor;
    ctx.font = `600 24px ${typography.bodyFont}`;
    ctx.fillText(signature.signatoryName, rightCenterX, footerLineY + 34);
    ctx.fillStyle = palette.textColor;
    ctx.font = `500 17px ${typography.metaFont}`;
    ctx.fillText(signature.signatoryRole.toUpperCase(), rightCenterX, footerLineY + 64);
  } else {
    ctx.fillStyle = palette.accentColor;
    ctx.font = `600 22px ${typography.metaFont}`;
    ctx.fillText(cert.serialText || 'DQR ARCHIVE', rightCenterX, footerLineY - 28);
    ctx.fillStyle = `${palette.borderColor}88`;
    ctx.fillRect(rightCenterX - 210, footerLineY, 420, 2);
    ctx.fillStyle = palette.textColor;
    ctx.font = `500 18px ${typography.metaFont}`;
    ctx.fillText('VERIFIED LEDGER', rightCenterX, footerLineY + 34);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeName = `${cert.recipientName}-${cert.titleText}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  link.download = `${safeName || 'dqr-certificate'}.png`;
  link.href = dataUrl;
  link.click();
}
