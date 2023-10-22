import { execFile, ChildProcess } from 'child_process';
import { readdirSync } from 'original-fs';
enum MvEnum{
    m0=0,mv1=1,mv2=2,mv3=3,mv4=4,mv5=5,mv6=6,noMove=7
}
enum GameResult{
    Undecided=0,WonByRed=1,WonByYellow=2,Draw=3
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
        this.ply++
        console.log(this)
    }
    unmakeMove():void{
        this.ply--
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
    private isWonBy(side:number):Boolean{
        const b=this.board[side]
        //horizontal check
        for(let i=0;i<6;i++){
            for(let j=0;j<4;j++){
                if(b[i][j] && b[i][j+1] && b[i][j+2] && b[i][j+3]) return true
            }
        }
        //vertical check
        for(let i=0;i<7;i++){
            for(let j=0;j<3;j++){
                if(b[j][i] && b[j+1][i] && b[j+2][i] && b[j+3][i]) return true
            }
        }
        //diagonal checks
        for(let i=0;i<4;i++){
            for(let j=0;j<3;j++){
                if(b[j][i] && b[j+1][i+1] && b[j+2][i+2] && b[j+3][i+3]) return true
            }
        }
        for(let i=6;i>2;i--){
            for(let j=0;j<3;j++){
                if(b[j][i] && b[j+1][i-1] && b[j+2][i-2] && b[j+3][i-3]) return true
            }
        }
        return false
    }
    getWinningRow():any[]{
        for(let side=0;side<2;side++){
            const b=this.board[side]
            //horizontal check
            for(let i=0;i<6;i++){
                for(let j=0;j<4;j++){
                    if(b[i][j] && b[i][j+1] && b[i][j+2] && b[i][j+3]) return [[i,j],[i,j+1],[i,j+2],[i,j+3]]
                }
            }
            //vertical check
            for(let i=0;i<7;i++){
                for(let j=0;j<3;j++){
                    if(b[j][i] && b[j+1][i] && b[j+2][i] && b[j+3][i]) return [[j,i],[j+1,i],[j+2,i],[j+3,i]]
                }
            }
            //diagonal checks
            for(let i=0;i<4;i++){
                for(let j=0;j<3;j++){
                    if(b[j][i] && b[j+1][i+1] && b[j+2][i+2] && b[j+3][i+3]) return [[j,i],[j+1,i+1],[j+2,i+2],[j+3,i+3]]
                }
            }
            for(let i=6;i>2;i--){
                for(let j=0;j<3;j++){
                    if(b[j][i] && b[j+1][i-1] && b[j+2][i-2] && b[j+3][i-3]) return [[j,i],[j+1,i-1],[j+2,i-2],[j+3,i-3]]
                }
            }
        }
        return []
    }
    getResult():GameResult{
        if(this.isWonBy(red)){ return GameResult.WonByRed }
        if(this.isWonBy(yellow)){ return GameResult.WonByYellow }
        if(this.ply==42){ return GameResult.Draw }
        return GameResult.Undecided
    }
}
function visualizeBoard(brd:Board){
    const colors=['red-circle','yellow-circle','no-circle']
    for(let i=0;i<7;i++){
        for(let j=0;j<6;j++){
            const el = document.getElementById('circle'+i+'.'+j) as HTMLElement
            el.classList.remove('no-circle','red-circle','yellow-circle','winning-circle')
            el.classList.add(colors[brd.getColor(j,i)])
        }
    }
}
function visualizeWinningRow(arr:any[]){
    for(let i=0;i<arr.length;i++){
        const el = document.getElementById('circle'+arr[i][1]+'.'+arr[i][0]) as HTMLElement
        el.classList.add('winning-circle')
    }
}
class Settings{
    private engines:string[]
    private players:string[]
    constructor(){
        this.engines=readdirSync('./engines/').filter((value:string)=>{
            if(value.endsWith('.exe')) return true
            return false;
        })
        this.engines.unshift('human')
        this.players=[this.engines[0],this.engines[1]]
        const el1=document.getElementById('player0') as HTMLSelectElement
        const el2=document.getElementById('player1') as HTMLSelectElement
        for(let i=0;i<this.engines.length;i++){
            const child1 = document.createElement('option')
            child1.innerText=this.engines[i]
            child1.value=this.engines[i]
            child1.id="selectElement0"+this.engines[i]
            const child2 = document.createElement('option')
            child2.innerText=this.engines[i]
            child2.value=this.engines[i]
            child2.id="selectElement1"+this.engines[i]
            el1.appendChild(child1)
            el2.appendChild(child2)
        }
        (document.getElementById('selectElement0'+this.players[0]) as HTMLOptionElement).selected=true;
        (document.getElementById('selectElement1'+this.players[1]) as HTMLOptionElement).selected=true;
        el1.addEventListener('change',(event:Event)=>{
            const el=event.target as HTMLSelectElement
            (document.getElementById('selectElement1'+this.players[0]) as HTMLOptionElement).disabled=false;
            const player=el.options[el.options.selectedIndex].id.replace('selectElement0','');
            this.players[0]=player;
            if(player!='human') {
                (document.getElementById('selectElement1'+player) as HTMLOptionElement).disabled=true
            }
        })
        el2.addEventListener('change',(event:Event)=>{
            const el=event.target as HTMLSelectElement
            (document.getElementById('selectElement0'+this.players[1]) as HTMLOptionElement).disabled=false;
            const player=el.options[el.options.selectedIndex].id.replace('selectElement1','');
            this.players[1]=player;
            if(player!='human'){
                (document.getElementById('selectElement0'+player) as HTMLOptionElement).disabled=true;
            }
        })
    }
    getPlayers():string[]{ return this.players }
}
class Protocoll{
    private children:any[];
    private b:Board;
    private side:Boolean;
    private players:Array<any>;
    private settings:Settings;
    constructor(settings:Settings){
        this.settings=settings
        this.side=false;
        this.b=new Board();
        this.players=this.settings.getPlayers()
        this.children=[undefined,undefined]
        if(this.players[0]!='human'){
            this.children[0]=execFile('./engines/'+this.players[0])
            this.startEngine()
        }
        if(this.players[1]!='human'){
            this.children[1]=execFile('./engines/'+this.players[1])
        }
        this.setInputEventListeners()
        this.setChildrenEventListeners()
    }
    setInputEventListeners(){
        for(let i=0;i<2;i++){
            const el = (document.getElementById('engineCommunicationInput'+i) as HTMLInputElement);
            el.addEventListener('keydown',(event:KeyboardEvent)=>{
                if(event.key==='Enter'){
                    const target=(event.target as HTMLInputElement)
                    let command = target.value
                    console.log(command)
                    const child=document.createElement('div')
                    child.classList.add('inputBlock')
                    child.innerText=command+'<<<<'
                    const parent=document.getElementById('engineCommunicationDisplay'+i) as HTMLElement
                    parent.insertBefore(child,parent.firstChild)
                    target.value=''
                    this.children[i].stdin.write(command+'\n')
                }
            })
        }
    }
    isValidEngineOutput(line:string){
        if(line.match('bestmove [0-6]')){
            return true
        }
        if(line.startsWith('info ')){
            const potentialArguments=['info depth ','eval ','nodes ','pv ']
            const mustMatch=['([0-9])+','-?([0-9])+','([0-9])+','([0-9] )+']
            for(let i=0;i<potentialArguments.length;i++){
                if(line.startsWith(potentialArguments[i])){
                    line=line.replace(potentialArguments[i],'')
                    let sub=line.substring(0,line.indexOf(' '))
                    if(!sub.match(mustMatch[i])){
                        return false
                    }
                }
            }
            return true
        }
        return false
    }
    setChildrenEventListeners(){
        if(this.children[0]!==undefined){
            this.children[0].stdout.on('data',(data:string)=>{
                const el = document.getElementById('engineCommunicationDisplay0') as HTMLDivElement
                console.log(data)
                let lines=data.split('\n').filter((line:string)=>{
                    return this.isValidEngineOutput(line)
                })
                const child=document.createElement('div')
                child.classList.add('outputBlock')
                const span=document.createElement('span')
                for(let i=0;i<lines.length;i++){
                    span.innerText=lines[i]
                    child.appendChild(span)
                }
                el.insertBefore(child,el.firstChild)
                const prefix='bestmove '
                if(data.includes(prefix)){
                    data=data.substring(data.lastIndexOf(prefix)+prefix.length,data.length)
                    let int=parseInt(data)
                    this.children[0].stdin.write('stop\n')
                    this.tryMove(int,this.players[0])
                }
            })
            this.children[0].stderr.on('data',(data:any)=>{console.log(data)})
        }
        if(this.children[1]!==undefined){
            this.children[1].stdout.on('data',(data:string)=>{
                const el = document.getElementById('engineCommunicationDisplay1') as HTMLDivElement
                let lines=data.split('\n').filter((line:string)=>{
                    return this.isValidEngineOutput(line)
                })
                const child=document.createElement('div')
                child.classList.add('outputBlock')
                const span=document.createElement('span')
                for(let i=0;i<lines.length;i++){
                    span.innerText=lines[i]
                    child.appendChild(span)
                }
                el.insertBefore(child,el.firstChild)
                const prefix='bestmove '
                if(data.includes(prefix)){
                    data=data.substring(data.lastIndexOf(prefix)+prefix.length,data.length)
                    let int=parseInt(data)
                    this.children[1].stdin.write('stop\n')
                    this.tryMove(int,this.players[1])
                }
            })
            this.children[1].stderr.on('data',(data:any)=>{console.log(data)})
        }
    }
    ensureChildrenMatchPlayers(){
        console.log(this.players)
        if(this.players[0]==='human'){
            if(this.children[0]!==undefined){
                this.children[0].kill('SIGINT')
                this.children[0]=undefined
            }
        }
        else{
            let killedProcess=false
            if(this.children[0]!==undefined){
                let file = (this.children[0] as ChildProcess).spawnfile
                file=file.substring(file.lastIndexOf('/')+1,file.length)
                if(this.players[0]!==file){
                    this.children[0].kill('SIGINT')
                    killedProcess=true
                }
            }
            this.children[0]=execFile('./engines/'+this.players[0])
            if(!this.side && killedProcess){
                this.startEngine()
            }
        }
        if(this.players[1]==='human'){
            if(this.children[1]!==undefined){
                this.children[1].kill('SIGINT')
                this.children[1]=undefined
            }
        }
        else{
            let killedProcess=false
            if(this.children[1]!==undefined){
                let file = (this.children[1] as ChildProcess).spawnfile
                file=file.substring(file.lastIndexOf('/')+1,file.length)
                if(this.players[1]!==file){
                    this.children[1].kill('SIGINT')
                    killedProcess=true
                }
            }
            this.children[1]=execFile('./engines/'+this.players[1])
            if(this.side && killedProcess){
                this.startEngine()
            }
        }
        this.setChildrenEventListeners()
    }
    tryMove(move:number,entity:any){
        const gameResult=this.b.getResult()
        if(!gameResult){
            this.ensureChildrenMatchPlayers()
        }
        else if(gameResult!=GameResult.Draw) {
            visualizeWinningRow(this.b.getWinningRow())
            return
        }
        console.log('try move '+move+' by '+entity)
        if(entity!==this.players[(this.side)?1:0]){
            return
        }
        let list = this.b.generateLegalMoves()
        if(list.moves.includes(move)){
            this.b.makeMove(move)
            visualizeBoard(this.b)
            console.log('RESULT: '+gameResult)
            if(gameResult){
                if(gameResult!=GameResult.Draw) visualizeWinningRow(this.b.getWinningRow())
                return
            }
            console.log('made move '+move)
            this.side=!this.side
            this.startEngine()
        }
    }
    private startEngine(){
        const asInd=(this.side)?1:0
        if(this.players[asInd] == 'human'){
            console.log('humans turn')
            return
        }
        this.children[asInd].stdin.write("position "+this.b.getHistory()+"\n")
        this.children[asInd].stdin.write("go movetime 1000\n")
    }
    reset(){
        (document.getElementById('engineCommunicationDisplay0') as HTMLInputElement).innerHTML='';
        (document.getElementById('engineCommunicationDisplay1') as HTMLInputElement).innerHTML='';
        this.side=false
        this.b=new Board()
        visualizeBoard(this.b)
        if(this.players[0]!='human'){
            if(this.children[0]!==undefined){
                this.children[0].kill('SIGINT')
            }
            this.children[0]=execFile('./engines/'+this.players[0])
            this.startEngine()
        }
        if(this.players[1]!='human'){
            if(this.children[1]!==undefined){
                this.children[1].kill('SIGINT')
            }
            this.children[1]=execFile('./engines/'+this.players[1])
        }
        this.setChildrenEventListeners()
        console.log(this.children)
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
            square.innerHTML='<div class="no-circle" id="circle'+i+'.'+j+'"></div>'
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
function resetGame(){
    prot.reset()
}
let prot=new Protocoll(new Settings())
console.log(prot)