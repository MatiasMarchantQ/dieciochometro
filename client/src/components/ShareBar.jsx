import { useRef, useState } from 'react';

export default function ShareBar({ items, theme }) {
    const canvasRef = useRef(null);
    const [includeZeros, setIncludeZeros] = useState(false);

    async function drawImage() {
        const canvas = canvasRef.current;
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        await document.fonts.ready;

        ctx.fillStyle = '#fdf6e8';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#0039a6';
        ctx.fillRect(0, 0, W, 24);
        ctx.fillStyle = '#d52b1e';
        ctx.fillRect(0, H - 24, W, 24);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#111111';
        ctx.font = '800 64px "Space Grotesk"';
        ctx.fillText(`${theme.headerEmoji} ${theme.shareHeading}`, W / 2, 220);

        const list = includeZeros ? items : items.filter((i) => i.count > 0);
        const startY = 340;
        const rowHeight = Math.min(170, (H - startY - 200) / Math.max(list.length, 1));

        list.forEach((item, index) => {
            const y = startY + index * rowHeight;
            const boxH = rowHeight - 24;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(80, y, W - 160, boxH);
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#111111';
            ctx.strokeRect(80, y, W - 160, boxH);

            ctx.textAlign = 'left';
            ctx.font = '72px sans-serif';
            ctx.fillText(item.emoji, 110, y + boxH / 2 + 24);

            ctx.font = '600 44px "Inter"';
            ctx.fillStyle = '#111111';
            ctx.fillText(item.name, 210, y + boxH / 2 + 15);

            ctx.textAlign = 'right';
            ctx.font = '800 68px "Space Grotesk"';
            ctx.fillStyle = '#d52b1e';
            ctx.fillText(String(item.count), W - 110, y + boxH / 2 + 22);
        });

        ctx.textAlign = 'center';
        ctx.font = '600 32px "Inter"';
        ctx.fillStyle = '#57534e';
        ctx.fillText(`Hecho con ${theme.appName}`, W / 2, H - 100);

        ctx.font = '600 26px "Inter"';
        ctx.fillStyle = '#9a948c';
        ctx.fillText('by Matías Marchant', W / 2, H - 60);

        return list;
    }

    async function share() {
        const list = await drawImage();
        if (list.length === 0) {
            alert('Todavía no tienes nada que contar. ¡Suma algo primero!');
            return;
        }

        canvasRef.current.toBlob(async (blob) => {
            const file = new File([blob], 'dieciochometro.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: `Mi ${theme.appName}`, text: `¡Así va! ${theme.headerEmoji}` });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'dieciochometro.png';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            alert('Imagen descargada. Súbela a tu Historia de Instagram desde la galería.');
        }, 'image/png');
    }

    return (
        <div className="nb-border nb-shadow rounded-xl p-5 text-center" style={{ background: 'var(--surface)' }}>
            <label className="flex items-center justify-center gap-2 text-sm font-semibold mb-2">
                <input type="checkbox" checked={includeZeros} onChange={(e) => setIncludeZeros(e.target.checked)} />
                Incluir items en cero al compartir
            </label>
            <button
                onClick={share}
                className="w-full py-4 nb-border nb-shadow rounded-xl font-display text-lg font-black uppercase text-white transition active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
                style={{ background: 'var(--accent)' }}
            >
                📲 Compartir en Instagram
            </button>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
