import { execFile } from 'child_process';
enum MvEnum{
    m0=0,mv1=1,mv2=2,mv3=3,mv4=4,mv5=5,mv6=6,noMove=7
}
type MvList = {moves:Array<number>, len:MvEnum}
const red=0;
const yellow=1;
const both=2;
const aFile = 1;
const bFile = 2;
const cFile = 4;
const dFile = 8;
const eFile = 16;
const fFile = 32;
const gFile = 64;
const Files=[aFile,bFile,cFile,dFile,eFile,fFile,gFile]
const firstLine=aFile + bFile + cFile + dFile + eFile + fFile + gFile;
const numberOfMovesLookup = (()=>{
    let ret=Array<number>(128)
    for(let i=0;i<128;i++){
        const notI=~i;
        let count=0;
        for(let j=0;j<7;j++){
            if((1<<j)&notI){
                count++;
            }
        }
        ret[i]=count;
    }
    return ret
})()
const moveLookup = (()=>{
    let ret=Array<Array<MvEnum>>(128)
    for(let i=0;i<128;i++){
        ret[i]=Array<MvEnum>(7)
        for(let j=0;j<7;j++){
            ret[i][j]=MvEnum.noMove;
        }
    }
    for(let i=0;i<128;i++){
        const notI=~i;
        let index=0;
        for(let j=0;j<7;j++){
            if((1<<j)&notI){
                ret[i][index++]=j
            }
        }
    }
    return ret
})()
console.log(numberOfMovesLookup)
console.log(moveLookup)
class Board{
    private moveHistory:string;
    private board:Array<Array<Array<Boolean>>>;
    private ply:number;
    private side:Boolean;
    constructor(){
        this.moveHistory=''
        this.board=Array<Array<Array<Boolean>>>(3);
        for(let i=0;i<3;i++){
            let arr=Array<Array<Boolean>>(6)
            for(let j=0;j<6;j++){
                let arr2=Array<Boolean>(7)
                for(let k=0;k<7;k++){
                    arr2[k]=false;
                }
                arr[j]=arr2
            }
            this.board[i]=arr
        }
        this.ply=0;
        this.side=false;
    }
    getFirstLineMask(index:number):number{
        let ret=0
        ret|=(this.board[index][0][0])?1:0
        ret|=((this.board[index][0][1])?1:0) << 1 
        ret|=((this.board[index][0][2])?1:0) << 2 
        ret|=((this.board[index][0][3])?1:0) << 3 
        ret|=((this.board[index][0][4])?1:0) << 4 
        ret|=((this.board[index][0][5])?1:0) << 5 
        ret|=((this.board[index][0][6])?1:0) << 6 
        return ret
    }
    generateLegalMoves():MvList{
        const asInd=(this.side)?1:0
        let index = this.getFirstLineMask(asInd) & firstLine
        let ret={moves:moveLookup[index],len:numberOfMovesLookup[index]}
        return ret
    }
    makeMove(move:MvEnum):void{
        const asInd=(this.side)?1:0
        this.moveHistory+=move
        let pos=0;
        while(pos<6 && !this.board[both][pos][move]){
            pos++;
        }
        pos--;
        this.board[asInd][pos][move]=true;
        this.board[both][pos][move]=true;
        this.side=!this.side
        console.log(this)
    }
    unmakeMove():void{
        this.side=!this.side
        const last=this.moveHistory.length-1
        const move=parseInt(this.moveHistory.charAt(last))
        this.moveHistory=this.moveHistory.substring(0,last)
        let pos=0;
        const asInd=(this.side)?1:0
        while(pos<6 && !this.board[both][pos][move]){
            pos++;
        }
        this.board[asInd][pos][move]=false;
        this.board[both][pos][move]=false;
    }
    getColor(x:number,y:number):number{
        if(this.board[red][x][y]){ return red }
        if(this.board[yellow][x][y]){ return yellow }
        return both
    }
    getHistory():string{
        return this.moveHistory
    }
}
function visualizeBoard(brd:Board){
    const colors=['red-circle','yellow-circle','no-circle']
    for(let i=0;i<7;i++){
        for(let j=0;j<6;j++){
            const el = document.getElementById('circle'+i+'.'+j) as HTMLElement
            el.classList.remove('no-circle','red-circle','yellow-circle')
            el.classList.add(colors[brd.getColor(j,i)])
        }
    }
}
type protocollSetting={playSelf:Boolean,playHuman:Boolean,firstMoveHuman:Boolean,}
class Protocoll{
    private child:any;
    private child2:any;
    private engine1:string;
    private engine2:string;
    private b:Board;
    private side:Boolean;
    private players:Array<any>;
    private settings:protocollSetting;
    constructor(engine1:string,engine2:string,settings:protocollSetting){
        this.engine1=engine1
        this.engine2=engine2
        this.settings=settings
        this.side=false;
        this.b=new Board();
        this.child=execFile('./engines/'+engine1)
        this.child.stdout.on('data',(data:string)=>{
            console.log(data)
            const prefix='bestmove '
            if(data.includes(prefix)){
                data=data.substring(data.lastIndexOf(prefix)+prefix.length,data.length)
                let int=parseInt(data)
                this.tryMove(int,this.engine1)
            }
        })
        if(settings.playHuman){
            if(settings.firstMoveHuman){
                this.players=['human',this.engine1]
            }
            else{
                this.players=[this.engine1,'human']
            }
        }
        else{
            this.child2=execFile('./engines/'+engine2)
            this.child2.stdout.on('data',(data:string)=>{
                console.log(data)
                const prefix='bestmove '
                if(data.includes(prefix)){
                    data=data.substring(data.lastIndexOf(prefix)+prefix.length,data.length)
                    let int=parseInt(data)
                    this.tryMove(int,this.engine2)
                }
            })
            this.players=[this.engine1,this.engine2]
        }
    }
    tryMove(move:number,entity:any){
        if(entity!==this.players[(this.side)?1:0]){
            return
        }
        let list = this.b.generateLegalMoves()
        if(list.moves.includes(move)){
            this.b.makeMove(move)
            visualizeBoard(this.b)
            this.side=!this.side
            this.startEngine()
        }
    }
    private startEngine(){
        if(this.players[(this.side)?1:0] == 'human'){
            return
        }
        this.child.stdin.write("position "+this.b.getHistory()+"\n")
        this.child.stdin.write("go movetime 1000\n")
    }
}
function main(){
    const el=document.getElementById('board') as HTMLElement
    for(let i=0;i<7;i++){
        const col = document.createElement('div')
        col.classList.add('board-col')
        col.setAttribute('id','boardCol'+i)
        for(let j=0;j<6;j++){
            const square= document.createElement('div')
            square.classList.add('board-square')
            square.innerHTML='<div class="no-circle" id="circle'+i+'.'+j+'"><div>'
            square.setAttribute('id','boardSquare'+i+'.'+j)
            col.appendChild(square)
        }
        col.addEventListener('click',(event:Event)=>{
            console.log((event.target as HTMLElement).id)
            let str=(event.target as HTMLElement).id
            if(str.includes('boardSquare')){
                str=str.substring(11,str.lastIndexOf('.'))
            }
            else{
                str=str.substring(6,str.lastIndexOf('.'))
            }
            let int=parseInt(str)
            prot.tryMove(int,'human')
        })
        el.appendChild(col)
    }
}
main()
let prot=new Protocoll('ConnectFour.exe','',{playHuman:true,playSelf:false,firstMoveHuman:true})