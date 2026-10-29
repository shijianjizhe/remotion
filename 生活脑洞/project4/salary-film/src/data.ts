export const SALARY=8000;
export const expenses=[['房租',2000,60,105,135],['吃饭',2000,135,180,210],['信用卡还款',1100,210,255,285],['交通通勤',400,285,315,345],['水电网话',400,345,375,405],['生活购物',900,405,450,480],['会员订阅',200,480,510,525]].map(([label,amount,start,hit,end],i)=>({label:String(label),amount:Number(amount),start:Number(start),hit:Number(hit),end:Number(end),i}));
export const after=expenses.map((_,i)=>SALARY-expenses.slice(0,i+1).reduce((s,e)=>s+e.amount,0));
export const amountAt=(f:number)=>expenses.reduce((v,e)=>v-e.amount*Math.max(0,Math.min(1,(f-e.hit+12)/12)),SALARY);
export const money=(v:number)=>'¥'+Math.round(v).toLocaleString('en-US');
export const screenshots=[6,45,105,180,255,315,375,450,510,555,660,750];
