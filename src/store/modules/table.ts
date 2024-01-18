import { defineStore } from 'pinia';

const useTableStore = defineStore('operaionBtn', {
    state: (): { tableScale: number } => ({
        tableScale: 1,
    }),
    actions: {
        initTableScale() {
            this.tableScale = 1
        },

        //放大缩小功能屏蔽 bug太多，不做开发 需要创建多个临时数据
        plusScale() {
            // if (this.tableScale >= 2) {
            //     console.log('已经加到最大了');
            //     return;
            // }
            // this.tableScale = Math.min(2, parseFloat((this.tableScale + 0.2).toFixed(1)));
            // console.log(this.tableScale)
        },
        reduceScale() {
            // if (this.tableScale <= 0.8) {
            //     console.log('已经减小到最小了');
            //     return;
            // }
            // // 使用 toFixed 来控制小数点后的位数并转换为数字
            // this.tableScale = parseFloat((this.tableScale - 0.2).toFixed(1));
            // console.log(this.tableScale)
        }
    }
});

export default useTableStore;
