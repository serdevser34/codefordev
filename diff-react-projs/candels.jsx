import { Layer, Line } from "react-konva";
import { Candle } from "./candle";

export const Candles = ({ sticks, setPopup, trend }) => {
    const width = 22;

    return (
        <>
            <Layer name={'candles'}>
                {sticks.map((el, i) => (
                    <Candle
                        key={el.t.getValue() + 'candle' + i}
                        el={el}
                        setPopup={setPopup}
                        i={i}
                        width={width}
                    />
                ))}
            </Layer>

            <Layer name={'trend-lines'}>
                {trend.map((trendLine, index) => {
                    const { startPoint, endPoint, orientation } = trendLine;

                    const startIndex = sticks.findIndex(stick => Number(stick.t.getValue()) === Number(startPoint[0]));
                    const endIndex = sticks.findIndex(stick => Number(stick.t.getValue()) === Number(endPoint[0]));



                    if (startIndex === -1 || endIndex === -1) return null;

                    const startX = width * startIndex + width / 2;
                    const endX = width * endIndex + width / 2;

                    const startY = orientation === "high"
                        ? sticks[startIndex].l.negate().getValue()
                        : sticks[startIndex].h.negate().getValue();

                    const endY = orientation === "high"
                        ? sticks[endIndex].l.negate().getValue()
                        : sticks[endIndex].h.negate().getValue();

                    return (
                        <Line
                            key={`trend-line-${index}`}
                            points={[+startX, +startY, +endX, +endY]}
                            stroke={orientation === 'high' ? 'blue' : 'orange'}
                            strokeWidth={'auto'}
                            strokeScaleEnabled={false}
                            tension={1}
                        />
                    );
                })}
            </Layer>
        </>
    );
};
