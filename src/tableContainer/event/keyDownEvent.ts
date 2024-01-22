

import useTableStore from "../../store/modules/table";

const handleKeydown = (event: KeyboardEvent, tableStore: ReturnType<typeof useTableStore>) => {
    const { plusScale, reduceScale } = tableStore
    // 检测操作系统
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    // 检测按键组合
    if (
        (isMac && event.metaKey && (event.key === '=' || event.key === '-')) || // macOS: Command + "+" / "-"
        (!isMac && event.ctrlKey && (event.key === '=' || event.key === '-'))   // Windows: Ctrl + "+" / "-"
    ) {
        event.preventDefault(); // 阻止默认的浏览器行为
        // 执行相应的操作
        if (event.key === '=') {
            plusScale()
        }
        if (event.key === '-') {
            reduceScale()
        }
    }
};

export default handleKeydown