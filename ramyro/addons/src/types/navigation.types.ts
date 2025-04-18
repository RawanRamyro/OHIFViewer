export interface NavigationParams {
    location: {
        pathname: string;
        search: string;
    };
    extensionManager: {
        getDataSources: (name: string) => any;
    };
    navigate: (options: { pathname: string; search: string }) => void;
}