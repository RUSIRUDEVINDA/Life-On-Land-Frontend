const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'dashboard', 'UsersPage.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const oldFooter = `                {!loading && !error && filtered.length > 0 && (
                    <div className="border-t border-border-light px-5 py-3">
                        <p className="text-[11px] text-text-gray">
                            Showing <span className="font-semibold text-primary-dark">{filtered.length}</span> of{' '}
                            <span className="font-semibold text-primary-dark">{users.length}</span> users
                        </p>
                    </div>
                )}`;

const newFooter = `                {!loading && !error && filtered.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-border-light px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[12px] text-text-gray">
                            Showing{' '}
                            <span className="font-semibold text-primary-dark">{rangeStart}–{rangeEnd}</span>{' '}
                            of{' '}
                            <span className="font-semibold text-primary-dark">{filtered.length}</span> users
                        </p>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={\`flex h-8 min-w-[32px] items-center justify-center rounded-xl border px-2 text-[12px] font-semibold transition \${
                                            page === currentPage
                                                ? 'border-primary-dark bg-primary-dark text-white'
                                                : 'border-border-light bg-white text-primary-dark hover:bg-bg-soft'
                                        }\`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-light bg-white text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )}`;

if (content.includes(oldFooter)) {
    fs.writeFileSync(filePath, content.replace(oldFooter, newFooter), 'utf8');
    console.log('Footer replaced successfully');
} else {
    const idx = content.indexOf('!loading && !error && filtered.length');
    console.log('Not found. Actual text around footer:\n', content.slice(idx, idx + 400));
}
