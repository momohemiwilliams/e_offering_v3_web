import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white px-1.5">
                <AppLogoIcon className="h-6 dark:bg-transparent dark:p-0" />
            </div>
            <div className="ml-1 grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">e-Offering</span>
                <span className="text-sidebar-foreground/70 truncate text-[11px]">Platform</span>
            </div>
        </>
    );
}
