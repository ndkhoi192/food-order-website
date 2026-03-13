import { createContext, useContext, useState, useCallback } from 'react';

const TableContext = createContext(null);

export function TableProvider({ children }) {
    const [selectedTable, setSelectedTable] = useState(() => {
        // Persist table selection in sessionStorage
        const saved = sessionStorage.getItem('selectedTable');
        return saved ? JSON.parse(saved) : null;
    });

    const selectTable = useCallback((table) => {
        setSelectedTable(table);
        if (table) {
            sessionStorage.setItem('selectedTable', JSON.stringify(table));
        } else {
            sessionStorage.removeItem('selectedTable');
        }
    }, []);

    const clearTable = useCallback(() => {
        setSelectedTable(null);
        sessionStorage.removeItem('selectedTable');
    }, []);

    return (
        <TableContext.Provider value={{ selectedTable, selectTable, clearTable }}>
            {children}
        </TableContext.Provider>
    );
}

export const useTable = () => {
    const ctx = useContext(TableContext);
    if (!ctx) throw new Error('useTable must be inside TableProvider');
    return ctx;
};
