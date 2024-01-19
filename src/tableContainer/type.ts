export interface TableCell {
    value: string; //显示数据内容
    isEdit: boolean; //是否可以修改
    isOverColor: boolean; //是否高亮
    type: string; //数据类型
    cellCode: string; //编号
    isShowPlaceholder: boolean; //是否显示占位
    fun: string; //公式
    designation: string; //名称
    identity: string; //标识
    horizontalPostion: string; //文字水平位置 列：水平居左，水平居右，水平居中 alignLeft,  alignRight, centerHorizontally.
    verticalPosition: string; //文字垂直位置 列：垂直居上 垂直居中 垂直居下 verticalTop verticalCenter verticalBottom
    fontColor: string | null; //文字颜色
    fontSize: number; //文字大小
    fontStyle: string;
    fontWeight: string; //文字粗细
    fontFamily: string; //文字字体
    isNoShowFont: boolean; //是否显示文字
    border: Border; //边框配置
    background: string; //背景色
    url: string; //超链接
    writeMode: string; //文字排版模式 纵向 水平 vertical  horizontal
    isBreakLine: boolean; //是否换行
    [key: string]: string | boolean | number | Border | null;  // 索引签名
}

export interface Border {
    topBorderColor: string; //上边框颜色
    leftBorderColor: string; //左边框颜色
    rightBorderColor: string; //右边框颜色
    bottomBorderColor: string; //下边框颜色
    borderSize: number; //边框粗细
}

export interface ColumnInfo {
    nums: number; //列数
    defaultWidth: number; //默认列宽
    indexHeight: number; //最左上角高
}

export interface RowInfo {
    nums: number; //行数
    defaultHeight: number; //默认行高
    indexWidth: number; //最左上角宽
}

export interface ColumnConfig {
    width: number; //列宽
    indexNum: number; //序号
    indexContent: string; //列名
    isFloat: boolean; //是否浮动
}

export interface RowConfig {
    height: number; //行高
    indexNum: number; //序号
    indexContent: number | string; //行名
    isFloat: boolean; //是否浮动
}

export interface TableConfig {
    tableData?: TableCell[][]; // 确保这里与 baseConfig 中的 tableData 类型一致
    mergeCell?: string[]; //合并单元格 ["A1:A2"]
    columnConfig?: ColumnConfig[]; //列宽数组
    rowConfig?: RowConfig[]; //行高数组
    columnInfo?: ColumnInfo; //列配置
    rowInfo?: RowInfo; //行配置
    // ...其他属性
}


export interface ScrollEvent {
    scrollLeft: number
    scrollTop: number
}

export interface RenderConfig {
    preRenderNum: number;
    currentRenderNum: number;
    renderStartIndex: number;
    renderEndIndex: number;
    startIndex: number;
    endIndex: number;
}

export interface SelectedCell {
    startRow: number | null;
    startCol: number | null;
    endRow: number | null;
    endCol: number | null;
    position?: string;
}

export type UserAction = {
    type: string;
    timestamp: Date;
    details: any;
};