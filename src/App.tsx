import React, {Dispatch, SetStateAction, useEffect, useRef, useState} from 'react';
import './App.css';

const App = () => {
    const [imgNum, setImgNum] = useState(0)

    return (
        <div className="App h-full w-full absolute top-0 flex flex-col justify-center items-center">
            <img src={'body' + imgNum + '.png'} alt="Failed to load images." className="h-[95%]"/>
            <div className="h-[5%] w-full flex items-center justify-center">
                {
                    Array.from(Array(5).keys()).map((_, idx) =>
                        <button key={idx} className={`
                            mx-2 py-2 px-4 border-2 rounded-2xl border-indigo-500
                            ${(idx === imgNum) ? "bg-indigo-500 text-white" : ""}
                            ${(idx !== imgNum) ? "hover:bg-indigo-200 hover:border-indigo-200" : ""}
                        `} onClick={() => setImgNum(idx)}>
                            {idx}
                        </button>
                    )
                }
            </div>
            <div className="absolute h-[95%] w-full top-0">
                <ClothesCanvasWait/>
            </div>
        </div>
    )
}

const ClothesCanvasWait = () => {
    const canvasRef = useRef(null)

    useEffect(() => {
        new ClothesCanvas(canvasRef.current!);
    }, [])

    return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight * 0.95}/>
}

class ClothesCanvas {
    width: number
    height: number
    context: CanvasRenderingContext2D

    // sleeveLength: number
    // setSleeveLength: Dispatch<SetStateAction<number>>
    // sleeveAngle: number
    // setSleeveAngle: Dispatch<SetStateAction<number>>
    // sleeveThickness: number
    // setSleeveThickness: Dispatch<SetStateAction<number>>
    // shoulderLength: number
    // setShoulderLength: Dispatch<SetStateAction<number>>
    // hemLength: number
    // setHemLength: Dispatch<SetStateAction<number>>
    // waistLength: number
    // setWaistLength: Dispatch<SetStateAction<number>>
    // flareLength: number
    // setFlareLength: Dispatch<SetStateAction<number>>

    constructor(canvas: HTMLCanvasElement) {
        this.context = canvas.getContext('2d')!;
        [this.width, this.height] = [canvas.width, canvas.height]

        canvas.addEventListener('click', (e) => this.onClick(e.x, e.y))
    }

    onClick(x: number, y: number) {
        this.context.beginPath()
        this.context.moveTo(x, y)
        this.context.lineTo(x + 50, y + 50)
        this.context.stroke()
    }
}

export default App
