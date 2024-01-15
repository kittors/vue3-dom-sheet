function columnIndexToTitle(index: number): string {
    let title = '';
    index++; // 调整计数开始于 1
    while (index > 0) {
        index--; // 调整为 0-based 索引
        title = String.fromCharCode('A'.charCodeAt(0) + (index % 26)) + title;
        index = Math.floor(index / 26);
    }
    return title;
}

function debounce(func: (...args: any[]) => void, wait: number, immediate = false) {
    let timeout: number | null = null;

    return function executedFunction(...args: any[]) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout as number);
        timeout = setTimeout(later, wait) as unknown as number;

        if (callNow) func(...args);
    };
}

export { columnIndexToTitle, debounce }