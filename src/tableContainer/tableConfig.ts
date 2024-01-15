import type { ColumnConfig, RowConfig, TableCell, TableConfig } from './type'
import { columnIndexToTitle } from '../utils/sheetUtils'
//行数列数 行高列高配置
const columnNum = 20;
const rowNum = 40;
const columnDefaultWidth = 80;
const rowDefaultHeight = 25;

//列名行名大小配置
const tableRowHeaderWidth = 80 //表格行名宽
const tableColHeaderHeight = 25 //表格列名高

function generateTableData(value: string = '', cols: number = columnNum, rows: number = rowNum): Promise<TableConfig> {
    return new Promise((resolve, reject) => {
        try {
            // 你的代码逻辑...
            // 创建 Config 对象
            /** ========表格数据层 包含了单元格的数据信息 合并单元格信息 列宽行高信息=========**/
            const baseConfig = {
                tableData: [],
                mergeCell: [],
                columnConfig: [] as ColumnConfig[],
                rowConfig: [] as RowConfig[],
                sheetInfo: {},
            };

            for (let i = 0; i < cols; i++) {
                const columnConfig: ColumnConfig = {
                    width: columnDefaultWidth,
                    indexNum: i,
                    isFloat: false,
                    indexContent: columnIndexToTitle(i),
                };
                baseConfig.columnConfig.push(columnConfig);
            }

            for (let i = 0; i < rows; i++) {
                const rowConfig: RowConfig = {
                    height: rowDefaultHeight,
                    indexNum: i,
                    isFloat: false,
                    indexContent: i + 1,
                };
                baseConfig.rowConfig.push(rowConfig);
            }

            const tableData: TableCell[][] = [];
            for (let i = 0; i < rows; i++) {
                const row: TableCell[] = [];
                for (let j = 0; j < cols; j++) {
                    row.push({
                        value,
                        isEdit: true,
                        isOverColor: false,
                        type: '',
                        cellCode: '',
                        designation: '',
                        identity: '',
                        horizontalPostion: 'leftAlign',
                        verticalPosition: 'verticalCenter',
                        fontColor: '',
                        fontSize: 14,
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                        fontFamily: '',
                        isNoShowFont: true,
                        border: {
                            topBorderColor: '',
                            leftBorderColor: '',
                            rightBorderColor: '',
                            bottomBorderColor: '',
                            borderSize: 1,
                        },
                        background: '',
                        url: '',
                        writeMode: 'horizontal',
                        isShowPlaceholder: false,
                        isBreakLine: false,
                    } as TableCell);
                }
                tableData.push(row);
            }

            const Config: TableConfig = {
                tableData,
                mergeCell: [],
                columnInfo: {
                    nums: cols,
                    defaultWidth: columnDefaultWidth,
                    indexHeight: tableColHeaderHeight,
                },
                rowInfo: {
                    nums: rows,
                    defaultHeight: rowDefaultHeight,
                    indexWidth: tableRowHeaderWidth,
                },
                columnConfig: baseConfig.columnConfig, // 这里可以考虑使用 baseConfig 的 columnWidths
                rowConfig: baseConfig.rowConfig, // 这里可以考虑使用 baseConfig 的 rowHeights
            };

            // 如果一切正常，解析 Promise
            setTimeout(() => {
                resolve(Config);
            }, 2000);
        } catch (error) {
            // 如果有任何错误，拒绝 Promise
            reject(error);
        }
    });
}



export default generateTableData


