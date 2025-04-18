// RamyroAddOns/src/services/NavigationService.ts
import { NavigationParams } from '../types/navigation.types';
import { RWorkListRoute, useExternalWorklist, RDataSource } from '../constants/RConstants';

export class NavigationService {
    static handleReturnNavigation({
        location,
        extensionManager,
        navigate,
    }: NavigationParams) {
        if (useExternalWorklist) {
            window.location.href = RWorkListRoute;
            return;
        }

        const { pathname } = location;
        const dataSourceIdx = pathname.indexOf('/', 1);
        const query = new URLSearchParams(window.location.search);
        const configUrl = query.get('configUrl');

        const searchQuery = new URLSearchParams();

        // If we have a dataSource in the constants, use it
        if (RDataSource) {
            searchQuery.append('datasources', RDataSource);
        } else if (dataSourceIdx !== -1) {
            // Fallback to the URL dataSource
            const dataSourceName = pathname.substring(dataSourceIdx + 1);
            const existingDataSource = extensionManager.getDataSources(dataSourceName);
            if (existingDataSource) {
                searchQuery.append('datasources', dataSourceName);
            }
        }

        if (configUrl) {
            searchQuery.append('configUrl', configUrl);
        }

        navigate({
            pathname: '/',
            search: decodeURIComponent(searchQuery.toString()),
        });
    }
}

export default NavigationService;