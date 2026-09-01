export default function Credit({ color }) {
    return (
        <div className="text-center text-xs font-semibold opacity-60" style={{ color }}>
            Hecho por{' '}
            <a
                href="https://www.instagram.com/matiasjesus_mq/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
            >
                Matías Marchant
            </a>
            {' · '}
            <a
                href="https://www.linkedin.com/in/mat%C3%ADas-marchant/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
            >
                LinkedIn
            </a>
            {' · '}
            <a
                href="https://www.instagram.com/matiasjesus_mq/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
            >
                Instagram
            </a>
        </div>
    );
}
