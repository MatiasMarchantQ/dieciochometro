import GlassPhotoPanel from './GlassPhotoPanel.jsx';
import ModePicker from '../theme/ModePicker.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';

export default function AuthLayout({ children }) {
    const { theme, mode, setMode, isSeasonal } = useTheme();
    const auth = theme.auth;

    return (
        <div className="min-h-screen flex flex-col md:flex-row" style={{ background: auth.pageBg }}>
            <div className="h-64 sm:h-72 md:h-auto md:w-1/2 lg:w-3/5 shrink-0">
                <GlassPhotoPanel />
            </div>

            <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-5">
                <div
                    className="w-full max-w-sm nb-border nb-shadow rounded-2xl p-8"
                    style={{
                        backgroundColor: auth.cardBg,
                        '--surface-border': auth.border,
                        '--auth-text': auth.text,
                        '--auth-text-muted': auth.textMuted,
                        '--auth-accent': auth.accent,
                    }}
                >
                    {children}
                </div>
            </div>

            <ModePicker mode={mode} setMode={setMode} isSeasonal={isSeasonal} theme={theme} />
        </div>
    );
}
