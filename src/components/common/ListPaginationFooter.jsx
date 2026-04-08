import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildPaginationWindow } from './paginationWindow';

/**
 * "Showing X–Y of Z" plus prev / next and condensed page buttons.
 * Use for client-sliced lists or server pages (pass API total count and page size).
 */
const ListPaginationFooter = ({
    totalItems,
    pageSize,
    currentPage,
    onPageChange,
    countSuffix = '',
    className = '',
    hideWhenEmpty = true,
}) => {
    const totalPages = Math.max(1, Math.ceil((totalItems || 0) / Math.max(1, pageSize || 1)));
    const safePage = Math.min(Math.max(1, currentPage || 1), totalPages);

    const rangeStart = totalItems <= 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, totalItems);

    const pageItems = useMemo(
        () => buildPaginationWindow(totalPages, safePage),
        [totalPages, safePage]
    );

    if (hideWhenEmpty && totalItems <= 0) return null;

    return (
        <div
            className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
        >
            <p className="text-[12px] text-text-gray">
                Showing{' '}
                <span className="font-semibold text-primary-dark">
                    {rangeStart}–{rangeEnd}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-primary-dark">{totalItems}</span>
                {countSuffix ? (
                    <>
                        {' '}
                        {countSuffix}
                    </>
                ) : null}
            </p>
            {totalPages > 1 ? (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Previous page"
                        onClick={() => onPageChange(Math.max(1, safePage - 1))}
                        disabled={safePage === 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={14} />
                    </button>

                    {pageItems.map((item, idx) =>
                        item === '…' ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-[12px] text-text-gray">
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                onClick={() => onPageChange(item)}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border text-[12px] font-semibold transition ${
                                    safePage === item
                                        ? 'border-primary-dark bg-primary-dark text-white'
                                        : 'border-border-light bg-white text-primary-dark hover:bg-bg-soft'
                                }`}
                            >
                                {item}
                            </button>
                        )
                    )}

                    <button
                        type="button"
                        aria-label="Next page"
                        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
                        disabled={safePage === totalPages}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default ListPaginationFooter;
