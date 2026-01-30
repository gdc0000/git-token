import React from 'react';

interface ExtensionFiltersProps {
    extensionStats: { ext: string; count: number; selected: number }[];
    handleToggleExtension: (ext: string) => void;
}

export const ExtensionFilters: React.FC<ExtensionFiltersProps> = ({ extensionStats, handleToggleExtension }) => {
    if (extensionStats.length === 0) return null;

    return (
        <div id="extension-filters" className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Filter by Type</p>
                <div className="flex flex-wrap gap-2">
                    {extensionStats.map((stat) => (
                        <button
                            key={stat.ext}
                            onClick={() => handleToggleExtension(stat.ext)}
                            className={`
                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors border
                                ${stat.selected === stat.count
                                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                                    : stat.selected > 0
                                        ? 'bg-secondary text-secondary-foreground border-secondary'
                                        : 'bg-transparent text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
                                }
                            `}
                        >
                            {stat.ext}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
