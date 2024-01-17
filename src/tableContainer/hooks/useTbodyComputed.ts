import { computed, Ref } from 'vue'
import type { SelectedCell, ColumnConfig, RowConfig, TableCell } from '../type'

export default function useTbodyComputed(startCell: Ref<SelectedCell>, endCell: Ref<SelectedCell>, columnConfig: Ref<ColumnConfig[]> | undefined, rowConfig: Ref<RowConfig[]> | undefined, defaultRowWidth: Ref<number> | undefined, selecting: Ref<boolean>, tableData: Ref<TableCell[][]> | undefined) {

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

    const selectedBoxWidth = computed(() => {
        if (!selectedArea.value || !columnConfig?.value) {
            return 0;
        }
        return columnConfig.value
            .slice(selectedArea.value.startCol, selectedArea.value.endCol + 1)
            .reduce((total, config) => {
                return total + config.width;
            }, -1);
    });

    const selectedBoxHeight = computed(() => {
        if (!selectedArea.value) {
            return 0;
        }
        return rowConfig?.value
            .slice(selectedArea.value.startRow, selectedArea.value.endRow + 1)
            .reduce((total, config) => {
                return total + config.height;
            }, -1);
    });

    const selectedLeft = computed(() => {
        if (!selectedArea.value || !columnConfig?.value || !defaultRowWidth?.value) {
            return 0;
        }
        return columnConfig.value
            .slice(0, selectedArea.value.startCol)
            .reduce((total, config) => {
                return total + config.width;
            }, defaultRowWidth.value);
    });
    const selectedTop = computed(() => {
        if (!selectedArea.value || !rowConfig?.value) {
            return 0;
        }
        return rowConfig.value
            .slice(0, selectedArea.value.startRow)
            .reduce((total, config) => {
                return total + config.height;
            }, 0);
    });

    const selectedBoxStyle = computed(() => {
        return {
            width: selectedBoxWidth.value + "px",
            height: selectedBoxHeight.value + "px",
            left: selectedLeft.value + "px",
            top: selectedTop.value + "px",
        };
    });

    const editBoxTop = computed(() => {
        if (rowConfig === undefined || startCell.value.startRow === null) {
            return 0;
        }

        return rowConfig.value
            .slice(0, startCell.value.startRow)
            .reduce((total, config) => {
                return total + config.height;
            }, 0);
    });

    const editBoxWidth = computed(() => {
        if (
            columnConfig === undefined ||
            startCell.value.startCol === null ||
            startCell.value.endCol === null
        ) {
            return 0;
        }
        return columnConfig.value
            .slice(startCell.value.startCol, startCell.value.endCol + 1)
            .reduce((total, config) => {
                return total + config.width;
            }, -1);
    });

    const editBoxHeight = computed(() => {
        if (
            rowConfig === undefined ||
            startCell.value.startRow === null ||
            startCell.value.endRow === null
        ) {
            return 0;
        }
        return rowConfig.value
            .slice(startCell.value.startRow, startCell.value.endRow + 1)
            .reduce((total, config) => {
                return total + config.height;
            }, -1);
    });

    const editBoxLeft = computed(() => {
        if (
            columnConfig === undefined ||
            startCell.value.startCol === null ||
            !defaultRowWidth?.value
        ) {
            return 0;
        }

        return columnConfig.value
            .slice(0, startCell.value.startCol)
            .reduce((total, config) => {
                return total + config.width;
            }, defaultRowWidth.value);
    });

    const editBoxStyle = computed(() => {
        return {
            width: editBoxWidth.value + "px",
            height: editBoxHeight.value + "px",
            left: editBoxLeft.value + "px",
            top: editBoxTop.value + "px",
        };
    });

    const longPressTransitionStyle =
        "width 80ms linear 0s, height 80ms linear 0s, right 80ms linear 0s, left 80ms linear 0s, bottom 80ms linear 0s, top 80ms linear 0s";

    const selectedBoxTransition = computed(() => {
        return selecting.value ? longPressTransitionStyle : "none 0s ease 0s";
    });

    const cellItem = computed(() => {
        if (
            tableData &&
            startCell.value.startRow !== null &&
            startCell.value.startCol !== null
        ) {
            return tableData.value[startCell.value.startRow][startCell.value.startCol];
        }
        return { fontSize: "", value: "" };
    });

    return { selectedArea, selectedBoxWidth, selectedBoxHeight, selectedLeft, selectedTop, selectedBoxStyle, editBoxStyle, selectedBoxTransition, cellItem }

}