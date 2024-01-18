import { computed, ref, reactive, Ref, watch, nextTick } from 'vue';
import type { TableConfig, ScrollEvent, RenderConfig, RowConfig, ColumnConfig } from '../type';
import { debounce } from '../../utils/sheetUtils'
import { ElScrollbar } from 'element-plus'
import useTableStore from '../../store/modules/table'

export default function useTableComputed(props: { tableConfig: TableConfig | null; height: number; width: number, cache: number }, currentTableHeight: Ref<number>, currentTableWidth: Ref<number>, scrollRef: Ref<typeof ElScrollbar | null>, tableStore: ReturnType<typeof useTableStore>) {

    const currentTableConfig = computed(() => props.tableConfig);
    const { initTableScale } = tableStore
    // 表格容器样式计算属性
    const tableContainerStyle = computed(() => {
        let heightValue;

        if (totalRowHeight.value !== 0) {
            heightValue = Math.min(currentTableHeight.value - 15, (totalRowHeight.value + (defaultColHeight.value as number)) - 1);
        } else {
            heightValue = currentTableHeight.value - 15;
        }

        let widthValue;
        if (totalColWidth.value !== 0) {
            widthValue = Math.min(currentTableWidth.value, (totalColWidth.value + (defaultRowWidth.value as number)) * scale.value);
        } else {
            widthValue = currentTableWidth.value;
        }

        return {
            borderTop: currentTableConfig.value ? "none" : "1px solid #eaeaea",
            borderLeft: currentTableConfig.value ? "none" : "1px solid #eaeaea",
            height: heightValue + 'px',
            width: widthValue - 1 + "px",
        };
    });

    //监听缩放 缩放feature放弃
    // watch(() => tableStore.tableScale, () => {
    //     fixResizeIssue()
    // })
    //监听当前表格数据修改
    watch(() => currentTableConfig.value, () => {
        scrollTop.value = 0
        scrollLeft.value = 0
        initTableScale()
        //需要等DOM渲染完成后执行
        nextTick(() => {
            getCurrentRenderRows(currentTableHeight.value - 15)
            getCurrentRenderCols(currentTableWidth.value)
            nextTick(() => {
                if (
                    scrollRef.value &&
                    scrollRef.value.wrapRef &&
                    scrollRef.value.wrapRef.parentNode
                ) {

                    updateHorizontalScrollbarVisibility(
                        totalColWidth.value * scale.value,
                        (defaultRowWidth.value as number) * scale.value,
                        currentTableWidth.value,
                        scrollRef.value.wrapRef
                    );

                    // 原有代码位置
                    updateVerticalScrollbarVisibility(
                        totalRowHeight.value * scale.value,
                        (defaultColHeight.value as number) * scale.value,
                        currentTableHeight.value,
                        scrollRef.value.wrapRef
                    );
                }
            });
        })
    }, { deep: true })

    function updateVerticalScrollbarVisibility(
        totalRowHeight: number,
        defaultColHeight: number,
        currentTableHeight: number,
        wrapRef: HTMLElement
    ): void {
        if (wrapRef.parentNode) {
            const verticalScrollbar = wrapRef.parentNode.querySelector<HTMLElement>('.is-vertical');
            if (totalRowHeight + defaultColHeight <= currentTableHeight - 15) {
                wrapRef.style.overflowY = 'visible';
                if (verticalScrollbar) {
                    verticalScrollbar.style.display = 'none';
                }
            } else {
                wrapRef.style.overflowY = 'auto'; // 这里只需要设置一次
                if (verticalScrollbar) {
                    verticalScrollbar.style.display = 'block';
                }
            }
        }
    }

    function updateHorizontalScrollbarVisibility(
        totalColWidth: number,
        defaultRowWidth: number,
        currentTableWidth: number,
        wrapRef: HTMLElement
    ): void {
        if (wrapRef.parentNode) {
            const horizontalScrollbar = wrapRef.parentNode.querySelector<HTMLElement>('.is-horizontal');

            if (totalColWidth + defaultRowWidth <= currentTableWidth) {
                wrapRef.style.overflowX = 'visible';
                if (horizontalScrollbar) {
                    horizontalScrollbar.style.display = 'none';
                }
            } else {
                wrapRef.style.overflowX = 'auto'; // 这里只需要设置一次
                if (horizontalScrollbar) {
                    horizontalScrollbar.style.display = 'block';
                }
            }
        }

    }

    //渲染向右位移距离
    const translaceRightWidth = computed(() => {
        const { renderStartIndex } = renderColConfig;
        if (!columnConfig.value) {
            return 0
        }
        return calculatePlaceHolderWidth(columnConfig.value.slice(0, renderStartIndex));
    });
    //计算渲染的宽
    const totalRenderWidth = computed(() => {
        if (!renderColArr.value) {
            return 0
        }
        return (
            renderColArr.value.reduce((total: number, colconfig: ColumnConfig) => total + colconfig.width, 0) +
            (defaultRowWidth.value as number) -
            renderColArr.value.length * 1
        );
    });

    //顶部占位容器的高
    const placeholderTopHeight = computed(() => {
        const { renderStartIndex } = renderRowConfig;
        if (!rowConfig.value) {
            return 0
        }
        return calculatePlaceholderHeight(rowConfig.value.slice(0, renderStartIndex));
    });


    // 辅助函数：计算占位高度
    function calculatePlaceholderHeight(rows: RowConfig[]): number {
        return rows.reduce((total, row) => total + row.height, 0);
    }

    //辅助函数：计算占位宽度
    function calculatePlaceHolderWidth(cols: ColumnConfig[]): number {
        return cols.reduce((total, col) => total + col.width, 0);
    }

    const fixedHorizontalValue = computed(() => {
        if (totalColWidth.value + (defaultRowWidth.value as number) > currentTableWidth.value) {
            return 1
        } else {
            return 0
        }
    })
    //计算行配置
    const rowConfig = computed(() =>
        currentTableConfig.value ? currentTableConfig.value.rowConfig : undefined
    );

    //所有行的总高
    const totalRowHeight = computed(() => {
        return rowConfig.value
            ? rowConfig.value.reduce((total, config) => {
                return total + config.height;
            }, 0)
            : 0;
    });



    //计算列的总宽
    const totalColWidth = computed(() => {
        return columnConfig.value
            ? columnConfig.value.reduce((total, config) => {
                return total + config.width;
            }, 0)
            : 0;
    });

    // 计算数据总高度
    const totalHeight = computed(() => {
        return (
            totalRowHeight.value +
            (defaultColHeight.value as number)
        );
    });

    //计算数据总宽
    const totalWidth = computed(() => {
        return (
            totalColWidth.value +
            (defaultRowWidth.value as number)
        );
    })

    //计算列配置
    const columnConfig = computed(() =>
        currentTableConfig.value ? currentTableConfig.value.columnConfig : undefined
    );

    //计算表格数据 二维数组
    const tableData = computed(() => {
        return currentTableConfig.value
            ? currentTableConfig.value.tableData
            : undefined;
    });

    const scale = computed(() => {
        return tableStore.tableScale
    })

    //计算列信息 反应的是列数等信息
    const columnInfo = computed(() => {
        return currentTableConfig.value
            ? currentTableConfig.value.columnInfo
            : undefined;
    });

    //计算列名高
    const defaultColHeight = computed(() => {
        return columnInfo.value ? columnInfo.value.indexHeight : undefined;
    });

    //计算行名宽
    const defaultRowWidth = computed(() => {
        return rowInfo.value ? rowInfo.value.indexWidth : undefined;
    });

    //计算行信息 反应的是行数等信息
    const rowInfo = computed(() => {
        return currentTableConfig.value
            ? currentTableConfig.value.rowInfo
            : undefined;
    });

    //计算容器高
    const computedHeight = computed(() => {
        return props.height;
    });

    //计算容器宽
    const computedWidth = computed(() => {
        return props.width;
    });


    //渲染行配置数组
    const renderRowArr = computed(() => {
        const { renderStartIndex, renderEndIndex } = renderRowConfig;
        if (!rowConfig.value) {
            return null
        }
        return rowConfig.value.slice(renderStartIndex, renderEndIndex);
    });

    //渲染列配置数组
    const renderColArr = computed(() => {
        const { renderStartIndex, renderEndIndex } = renderColConfig;
        if (!columnConfig.value) {
            return null
        }
        return columnConfig.value.slice(renderStartIndex, renderEndIndex);
    })


    //解决sticky布局造成的容器显示异常 
    const columnHeaderHeight = computed(() => {
        if (!defaultColHeight.value) {
            return 0
        }
        return (scrollTop.value === 0 ? defaultColHeight.value : defaultColHeight.value + 1)
    })

    const columnHeaderBottomBorder = computed(() => {
        return scrollTop.value === 0 ? 'none' : '1px var(--table-border)'
    })

    const rowHeaderWidth = computed(() => {
        if (!defaultRowWidth.value) {
            return 0
        }
        return (scrollLeft.value === 0 ? defaultRowWidth.value : defaultRowWidth.value + 1)
    })

    const rowHeaderRightBorder = computed(() => {
        return scrollLeft.value === 0 ? 'none' : '1px var(--table-border)'
    })

    const fixTranslaceRightWidth = computed(() => {
        return scrollLeft.value === 0 ? translaceRightWidth.value : translaceRightWidth.value - 1
    })

    //滚动条向左距离
    const scrollLeft = ref<number>(0);
    //滚动条向上距离
    const scrollTop = ref<number>(0);

    //渲染行配置
    const renderRowConfig = reactive({
        preRenderNum: props.cache,
        currentRenderNum: 0,
        renderStartIndex: 0,
        renderEndIndex: 0,
        startIndex: 0,
        endIndex: 0,
    });

    //配置列配置
    const renderColConfig = reactive({
        preRenderNum: props.cache,
        currentRenderNum: 0,
        renderStartIndex: 0,
        renderEndIndex: 0,
        startIndex: 0,
        endIndex: 0,
    });

    //获取当前可以渲染的行数以及列数
    const getCurrentRenderRows = (viewPortHeight: number) => {
        let accumulatedHeight = 0;
        let startRowIndex = 0;
        if (defaultColHeight.value && rowInfo.value?.defaultHeight && rowConfig.value && scrollRef.value) {
            renderRowConfig.currentRenderNum = Math.ceil((viewPortHeight - defaultColHeight.value * scale.value) / (rowInfo.value?.defaultHeight * scale.value));
            // 确定渲染的结束索引，保证不超出行配置数组的长度
            for (let i = 0; i < rowConfig.value.length; i++) {
                accumulatedHeight += rowConfig.value[i].height * scale.value;
                if (accumulatedHeight > scrollTop.value) {
                    startRowIndex = i;
                    break;
                }
            }
            // 更新行配置
            updateRenderConfig(renderRowConfig, startRowIndex, rowConfig.value.length);
            scrollRef.value.wrapRef.removeEventListener('wheel', onScrollHandler);
            scrollRef.value.wrapRef.removeEventListener('scroll', onScrollHandler);
            // 添加新的事件监听器
            scrollRef.value.wrapRef.addEventListener('wheel', onScrollHandler, { passive: false });
            scrollRef.value.wrapRef.addEventListener('scroll', onScrollHandler);
        }

    }
    //获取渲染的列数
    const getCurrentRenderCols = (viewPortWidth: number) => {
        if (!columnConfig.value || !defaultRowWidth.value || !columnInfo.value) return
        let accumulatedWidth = 0;
        let startColIndex = 0;
        const scroll = scrollLeft.value;
        for (let i = 0; i < columnConfig.value.length; i++) {
            accumulatedWidth += columnConfig.value[i].width * scale.value;
            if (accumulatedWidth > scroll) {
                startColIndex = i;
                break;
            }
        }
        renderColConfig.currentRenderNum = Math.ceil((viewPortWidth - defaultRowWidth.value * scale.value) / (columnInfo.value?.defaultWidth * scale.value));
        // 确定渲染的结束索引，保证不超出行配置数组的长度
        // 更新列配置
        updateRenderConfig(renderColConfig, startColIndex, columnConfig.value.length);
    };


    // 定义一个变量来存储上一次滚动位置
    let lastScrollTop = 0;
    let lastScrollLeft = 0;
    let scrollRAF: number;
    const onScrollHandler = (event: WheelEvent | Event) => {
        if (!scrollRef.value?.wrapRef) return;
        // 检查事件是否由鼠标滚轮触发
        if (event.type === 'wheel') {
            // 类型断言，将 event 断言为 WheelEvent
            const wheelEvent = event as WheelEvent;
            if (wheelEvent.deltaY !== 0) {
                wheelEvent.preventDefault();
                const verticalScrollAmount = wheelEvent.deltaY * 0.5; // 对垂直滚轮进行减速
                scrollRef.value.wrapRef.scrollBy(0, verticalScrollAmount);
            }

            if (wheelEvent.deltaX !== 0) {
                wheelEvent.preventDefault();
                const horizontalScrollAmount = wheelEvent.deltaX * 0.5; // 对水平滚轮进行减速
                scrollRef.value.wrapRef.scrollBy(horizontalScrollAmount, 0);
            }
        }
        const ScrollT = scrollTop.value
        const scrollL = scrollLeft.value
        // // 检查滚动位置是否有显著变化
        if (
            Math.abs(lastScrollTop - ScrollT) < (rowInfo.value?.defaultHeight as number) &&
            Math.abs(lastScrollLeft - scrollL) < (columnInfo.value?.defaultWidth as number)
        ) {
            return;
        }
        lastScrollTop = ScrollT; // 更新最后的滚动位置
        lastScrollLeft = scrollL;
        // 增加滚动性能
        if (scrollRAF) {
            //取消动画帧
            cancelAnimationFrame(scrollRAF);
        }
        //开启动画帧
        scrollRAF = requestAnimationFrame(() => {
            // 初始化累加器和索引
            let accumulatedHeight = 0;
            let accumulatedWidth = 0;
            let startRowIndex = 0;
            let startColIndex = 0;
            if (!rowConfig.value || !columnConfig.value) {
                return
            }
            // 计算起始行索引
            if (ScrollT > 0) {
                for (let i = 0; i < rowConfig.value.length; i++) {
                    accumulatedHeight += rowConfig.value[i].height * scale.value;
                    if (accumulatedHeight > ScrollT) {
                        startRowIndex = i;
                        break;
                    }
                }
            }
            if (scrollL > 0) {
                for (let i = 0; i < columnConfig.value.length; i++) {
                    accumulatedWidth += columnConfig.value[i].width * scale.value;
                    if (accumulatedWidth > scrollL) {
                        startColIndex = i;
                        break;
                    }
                }
            }
            // 更新行配置
            updateRenderConfig(renderRowConfig, startRowIndex, rowConfig.value.length);
            // 更新列配置
            updateRenderConfig(renderColConfig, startColIndex, columnConfig.value.length);
        });
    }

    function updateRenderConfig(renderConfig: RenderConfig, startIdx: number, totalLength: number) {
        const { currentRenderNum, preRenderNum } = renderConfig;

        renderConfig.startIndex = startIdx;
        renderConfig.endIndex = startIdx + currentRenderNum - 1;
        renderConfig.renderEndIndex = Math.min(renderConfig.endIndex + preRenderNum, totalLength);
        renderConfig.renderStartIndex = startIdx >= preRenderNum ? startIdx - preRenderNum : 0;
    }

    //每次拖动行列缩放窗口以及缩放大小的时候，刷新下渲染区防止出现异常 （从大范围拖动到小范围，导致渲染区域异常计算）
    const fixResizeIssue = () => {
        // let accumulatedHeight = 0;
        // let startRowIndex = 0;
        // if (!scrollRef.value?.wrapRef || !rowConfig.value || !defaultColHeight.value || !rowInfo.value?.defaultHeight) return;
        // const scrollTop = scrollRef.value?.wrapRef.scrollTop;
        // // 计算当前视口内可渲染的行数
        // renderRowConfig.currentRenderNum = Math.ceil(
        //     ((currentTableHeight.value - 15 as number) - defaultColHeight.value * scale.value) / (rowInfo.value?.defaultHeight * scale.value),
        // );
        // // 确定渲染的结束索引，保证不超出行配置数组的长度
        // for (let i = 0; i < rowConfig.value.length; i++) {
        //     accumulatedHeight += rowConfig.value[i].height * scale.value;
        //     if (accumulatedHeight > scrollTop.value) {
        //         startRowIndex = i;
        //         console.log(startRowIndex)
        //         console.log(renderRowConfig.currentRenderNum)
        //         break;
        //     }
        // }
        // console.log(startRowIndex)
        // 更新行配置
        getCurrentRenderRows(currentTableHeight.value - 15)
        getCurrentRenderCols(currentTableWidth.value);
    };
    //防抖处理
    const debounceGetCurrentRenderRows = debounce(getCurrentRenderRows, 200);
    const debouceGetCurrentRenderCols = debounce(getCurrentRenderCols, 200);

    //element滚动条监听
    const listerScroll = (event: ScrollEvent) => {
        scrollLeft.value = event.scrollLeft;
        scrollTop.value = event.scrollTop;
    };

    //计算滚动条到容器顶部的距离
    const computedScrollTop = computed(() => {
        return scrollTop.value
    })

    //计算滚动条到容器最左边边框的距离
    const computedScrollLeft = computed(() => {
        return scrollLeft.value
    })


    return {
        currentTableConfig,
        tableContainerStyle,
        rowConfig,
        columnConfig,
        totalRowHeight,
        totalColWidth,
        tableData,
        defaultColHeight,
        defaultRowWidth,
        computedHeight,
        computedWidth,
        columnInfo,
        rowInfo,
        listerScroll,
        scrollTop: computedScrollTop,
        scrollLeft: computedScrollLeft,
        debounceGetCurrentRenderRows,
        debouceGetCurrentRenderCols,
        updateHorizontalScrollbarVisibility,
        updateVerticalScrollbarVisibility,
        fixedHorizontalValue,
        renderRowArr,
        placeholderTopHeight,
        totalHeight,
        totalWidth,
        totalRenderWidth,
        translaceRightWidth,
        renderColArr,
        scale,
        fixResizeIssue,
        columnHeaderHeight,
        columnHeaderBottomBorder,
        rowHeaderRightBorder,
        rowHeaderWidth,
        fixTranslaceRightWidth,
        renderColConfig,
        renderRowConfig
    }

}