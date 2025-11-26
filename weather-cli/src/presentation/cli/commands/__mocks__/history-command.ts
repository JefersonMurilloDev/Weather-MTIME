export class HistoryManager {
    logSearch = jest.fn();
    getHistory = jest.fn().mockReturnValue([]);
    clear = jest.fn();
}
