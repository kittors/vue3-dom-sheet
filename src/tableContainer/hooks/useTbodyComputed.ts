import { computed } from 'vue'

interface SelectedCell {
    startRow: number | null;
    startCol: number | null;
    endRow: number | null;
    endCol: number | null;
    position?: string;
}

export default function useTbodyComputed() {

    //辅助函数
    const isCellValid = (cell: SelectedCell): boolean => {
        return (
            cell.startRow !== null &&
            cell.endRow !== null &&
            cell.startCol !== null &&
            cell.endCol !== null
        );
    };

    const selectedArea = computed(() => {
        if (isCellValid(startCell.value) && isCellValid(endCell.value)) {
            // 确保startRow, endRow, startCol, endCol不为null
            const startRow = Math.min(
                startCell.value.startRow!,
                endCell.value.startRow!
            );
            const endRow = Math.max(startCell.value.endRow!, endCell.value.endRow!);
            const startCol = Math.min(
                startCell.value.startCol!,
                endCell.value.startCol!
            );
            const endCol = Math.max(startCell.value.endCol!, endCell.value.endCol!);

            return {
                startRow,
                endRow,
                startCol,
                endCol,
            };
        }
        return null;
    });

    return { selectedArea }

}