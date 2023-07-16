import React, {Dispatch, MutableRefObject, RefObject, SetStateAction, useEffect, useRef, useState} from 'react';
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
                <GarmentCanvasWait/>
            </div>
        </div>
    )
}

function GarmentCanvasWait() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        new GarmentCanvas(canvasRef.current!);
    }, [])

    return <canvas ref={canvasRef} width={window.innerWidth}
                   height={window.innerHeight * 0.95} className="z-10"/>
}

type Vector = [number, number]

enum GarmentPart {
    ShoulderLeft, ShoulderRight, WaistLeft, WaistRight,
    FlareLeft, FlareRight, SleeveLeft, SleeveRight, Hem,
    SleeveLeftInner, SleeveRightInner, ShoulderLeftInner, ShoulderRightInner,
}

class GarmentCanvas {
    width: number
    height: number
    context: CanvasRenderingContext2D

    garmentOrigin: Vector
    shoulderLength: number
    sleeveVector: Vector
    sleeveThickness: number
    hemLength: number
    waistLength: number
    flareLength: number

    constructor(canvas: HTMLCanvasElement) {
        this.context = canvas.getContext('2d')!;
        [this.width, this.height] = [canvas.width, canvas.height]

        // initialize each parameter & render the garment
        this.garmentOrigin = [0.5, 0.2]
        this.shoulderLength = 0.2
        this.sleeveVector = [0.1, 0.2]
        this.sleeveThickness = 0.05  // this is the ratio for width
        this.hemLength = 0.4
        this.waistLength = 0.15
        this.flareLength = 0.3
        this.renderGarment()

        let mouseOrigin: Vector | null = null
        let garmentPart: GarmentPart | null = null

        canvas.addEventListener('mousedown', (e) => {
            if (mouseOrigin === null) {
                const mousePos: Vector = [e.x, e.y]
                garmentPart = this.detectPart(mousePos)
                if (garmentPart === null) return;

                mouseOrigin = mousePos
            } else {
                mouseOrigin = null
            }
        })

        canvas.addEventListener('mouseup', (e) => {
            mouseOrigin = null;
        })

        canvas.addEventListener('mousemove', (e) => {
            if (mouseOrigin === null) return;

            const mouseDelta: Vector = [
                (e.x - mouseOrigin[0]) / this.width, (e.y - mouseOrigin[1]) / this.height
            ]
            this.transformPart(garmentPart!, mouseDelta)
            mouseOrigin = [e.x, e.y]
        })
    }

    _getVertices(): { [key in GarmentPart]: Vector } {
        const [w, h] = [this.width, this.height]
        const [origX, origY] = [this.garmentOrigin[0] * w, this.garmentOrigin[1] * h]

        const shoulderHalf = w * this.shoulderLength / 2
        const shoulderLeft = [origX - shoulderHalf, origY]
        const shoulderRight = [origX + shoulderHalf, origY]

        const waistHalf = w * this.waistLength / 2
        const hemHalf = h * this.hemLength / 2
        const flareHalf = w * this.flareLength / 2
        const waistRight = [origX + waistHalf, origY + hemHalf]
        const flareRight = [origX + flareHalf, origY + h * this.hemLength]
        const flareLeft = [origX - flareHalf, origY + h * this.hemLength]
        const waistLeft = [origX - waistHalf, origY + hemHalf]

        const [sleeveX, sleeveY] = [w * this.sleeveVector[0], h * this.sleeveVector[1]]
        const sleeveLeft = [origX - shoulderHalf - sleeveX, origY + sleeveY]
        const scale = w * this.sleeveThickness / (sleeveX ** 2 + sleeveY ** 2) ** 0.5
        const normal = [-sleeveY * scale, sleeveX * scale]
        const sleeveLeftInner = [sleeveLeft[0] - normal[0], sleeveLeft[1] + normal[1]]
        const shoulderLeftInner = [origX - shoulderHalf - normal[0], origY + normal[1]]

        const sleeveRight = [origX + shoulderHalf + sleeveX, origY + sleeveY]
        const sleeveRightInner = [sleeveRight[0] + normal[0], sleeveRight[1] + normal[1]]
        const shoulderRightInner = [origX + shoulderHalf + normal[0], origY + normal[1]]

        return {
            [GarmentPart.ShoulderLeft]: shoulderLeft as Vector,
            [GarmentPart.ShoulderRight]: shoulderRight as Vector,
            [GarmentPart.WaistRight]: waistRight as Vector,
            [GarmentPart.FlareRight]: flareRight as Vector,
            [GarmentPart.FlareLeft]: flareLeft as Vector,
            [GarmentPart.WaistLeft]: waistLeft as Vector,
            [GarmentPart.SleeveLeft]: sleeveLeft as Vector,
            [GarmentPart.SleeveLeftInner]: sleeveLeftInner as Vector,
            [GarmentPart.ShoulderLeftInner]: shoulderLeftInner as Vector,
            [GarmentPart.SleeveRight]: sleeveRight as Vector,
            [GarmentPart.SleeveRightInner]: sleeveRightInner as Vector,
            [GarmentPart.ShoulderRightInner]: shoulderRightInner as Vector,
            [GarmentPart.Hem]: [origX, origY + h * this.hemLength],
        }
    }

    renderGarment() {
        this.context.clearRect(0, 0, this.width, this.height)

        const vertices = this._getVertices()

        // render body part
        const shoulderLeft = vertices[GarmentPart.ShoulderLeft]
        const shoulderRight = vertices[GarmentPart.ShoulderRight]
        const waistRight = vertices[GarmentPart.WaistRight]
        const flareRight = vertices[GarmentPart.FlareRight]
        const flareLeft = vertices[GarmentPart.FlareLeft]
        const waistLeft = vertices[GarmentPart.WaistLeft]

        this.context.beginPath()
        this.context.moveTo(shoulderLeft[0], shoulderLeft[1])
        this.context.lineTo(shoulderRight[0], shoulderRight[1])
        this.context.lineTo(waistRight[0], waistRight[1])
        this.context.lineTo(flareRight[0], flareRight[1])
        this.context.lineTo(flareLeft[0], flareLeft[1])
        this.context.lineTo(waistLeft[0], waistLeft[1])
        this.context.lineTo(shoulderLeft[0], shoulderLeft[1])
        this.context.stroke()

        // render the left sleeve
        const sleeveLeft = vertices[GarmentPart.SleeveLeft]
        const sleeveLeftInner = vertices[GarmentPart.SleeveLeftInner]
        const shoulderLeftInner = vertices[GarmentPart.ShoulderLeftInner]

        this.context.beginPath()
        this.context.moveTo(shoulderLeft[0], shoulderLeft[1])
        this.context.lineTo(sleeveLeft[0], sleeveLeft[1])
        this.context.lineTo(sleeveLeftInner[0], sleeveLeftInner[1])
        this.context.lineTo(shoulderLeftInner[0], shoulderLeftInner[1])
        this.context.lineTo(shoulderLeft[0], shoulderLeft[1])
        this.context.stroke()

        // render the right sleeve
        const sleeveRight = vertices[GarmentPart.SleeveRight]
        const sleeveRightInner = vertices[GarmentPart.SleeveRightInner]
        const shoulderRightInner = vertices[GarmentPart.ShoulderRightInner]

        this.context.beginPath()
        this.context.moveTo(shoulderRight[0], shoulderRight[1])
        this.context.lineTo(sleeveRight[0], sleeveRight[1])
        this.context.lineTo(sleeveRightInner[0], sleeveRightInner[1])
        this.context.lineTo(shoulderRightInner[0], shoulderRightInner[1])
        this.context.lineTo(shoulderRight[0], shoulderRight[1])
        this.context.stroke()
    }

    detectPart(mousePos: Vector): GarmentPart | null {
        const threshold = 0.05
        const vertices = this._getVertices()

        for (const [garmentPart_, [x, y]] of Object.entries(vertices)) {
            const garmentPart = parseInt(garmentPart_) as GarmentPart
            if (garmentPart === GarmentPart.ShoulderLeftInner
                || garmentPart === GarmentPart.ShoulderRightInner)
                continue;

            const dist = ((mousePos[0] - x) ** 2 + (mousePos[1] - y) ** 2) ** 0.5
            if (dist < this.height * threshold) {
                return garmentPart
            }
        }

        return null
    }

    transformPart(garmentPart: GarmentPart, mouseDelta: Vector) {
        if (garmentPart === GarmentPart.ShoulderLeft) {
            this.shoulderLength += -mouseDelta[0]
            this.shoulderLength = Math.min(this.shoulderLength, 5)
        } else if (garmentPart === GarmentPart.ShoulderRight) {
            this.shoulderLength += mouseDelta[0]
            this.shoulderLength = Math.min(this.shoulderLength, 5)
        } else if (garmentPart === GarmentPart.WaistLeft) {
            this.waistLength += -mouseDelta[0]
            this.waistLength = Math.min(this.waistLength, 5)
        } else if (garmentPart === GarmentPart.WaistRight) {
            this.waistLength += mouseDelta[0]
            this.waistLength = Math.min(this.waistLength, 5)
        } else if (garmentPart === GarmentPart.FlareLeft) {
            this.flareLength += -mouseDelta[0]
            this.flareLength = Math.min(this.flareLength, 5)
        } else if (garmentPart === GarmentPart.FlareRight) {
            this.flareLength += mouseDelta[0]
            this.flareLength = Math.min(this.flareLength, 5)
        } else if (garmentPart === GarmentPart.Hem) {
            this.hemLength += mouseDelta[1]
            this.hemLength = Math.min(this.hemLength, 5)
        } else if (garmentPart === GarmentPart.SleeveLeft
            || garmentPart === GarmentPart.SleeveLeftInner) {
            this.sleeveVector[0] += -mouseDelta[0]
            this.sleeveVector[1] += mouseDelta[1]
        } else if (garmentPart === GarmentPart.SleeveRight
            || garmentPart === GarmentPart.SleeveRightInner) {
            this.sleeveVector[0] += mouseDelta[0]
            this.sleeveVector[1] += mouseDelta[1]
        } else {
            console.log("Unknown part", typeof garmentPart)
        }

        this.renderGarment()
    }
}

export default App
