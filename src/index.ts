enum MvEnum{
    m0=0,mv1=1,mv2=2,mv3=3,mv4=4,mv5=5,mv6=6
}
const moveLookup = (()=>{
})()
const numberOfMovesLookup = (()=>{
})()
class Board{
    private moveHistory:string;
    constructor(){
        this.moveHistory=''
    }
    makeMove(move:MvEnum):void{
        this.moveHistory+=move
    }
    unmakeMove():void{
        const last=this.moveHistory.length-1
        const move=parseInt(this.moveHistory.charAt(last))
        this.moveHistory=this.moveHistory.substring(0,last)
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
            str=str.substring(6,str.lastIndexOf('.'))
            let int=parseInt(str)
        })
        el.appendChild(col)
    }
}
main()