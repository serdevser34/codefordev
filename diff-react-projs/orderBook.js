import {useCallback, useState} from "react";

export const OrderBook = ({ lastSuggest, history }) => {
    const [hide, setHide] = useState(+localStorage.getItem('hide') || 0);
    const hideOrders = useCallback(() => {
        setHide(h => {
            localStorage.setItem('hide', +h? '0' : '1')
            return  +h? 0 : 1
        });
    }, []);

    return <>
        <div className={'orderbookWrapperBlock'} onClick={hideOrders}>
            <div className={'orderbookBlock'}>
                {(!history || !lastSuggest) && <div>Orderbook is not available now</div>}

                {history && lastSuggest && <div className={"asksOrderbook"} style={+hide? { filter: 'blur(1px)' } : {}}>
                    <p className={'tableTitle'}>Sell side asks
                        {lastSuggest.orderbookSellSide &&
                            <span style={{ marginLeft: 5 }}>({lastSuggest.orderbookSellSide?.depthBuy})</span>}</p>
                    <div className={'wrapperForOrderbook'}>
                        {lastSuggest.orderbookSellSide?.asks?.map((e, i) =>
                            <p className={i < lastSuggest.orderbookSellSide?.depthBuy ? 'selectedRow' : ''}
                               key={e[0] + e[1] + i + 'key0'}>
                                <span>{e[0]}</span>
                                <span><abbr title={e[1]}>{e[1].toFixed(2)}</abbr></span>
                            </p>)}
                    </div>
                </div>}

                {history && lastSuggest && <div className={"bidsOrderbook marginRight"}>
                    <p className={'tableTitle'}>Sell side bids
                        {lastSuggest.orderbookSellSide &&
                            <span style={{ marginLeft: 5 }}>({lastSuggest.orderbookSellSide?.depthSell})</span>}</p>
                    <div className={'wrapperForOrderbook'}>
                        {lastSuggest.orderbookSellSide?.bids?.map((e, i) =>
                            <p className={i < lastSuggest.orderbookSellSide?.depthSell? 'selectedRow' : ''}
                               key={e[0] + e[1] + i + 'key1'}>
                                <span>{e[0]}</span>
                                <span><abbr title={e[1]}>{e[1].toFixed(2)}</abbr></span>
                            </p>)}
                    </div>
                </div>}

                {history && lastSuggest && <div className={"asksOrderbook"}>
                    <p className={'tableTitle'}>Buy side asks
                        {lastSuggest.orderbookBuySide &&
                            <span style={{ marginLeft: 5 }}>({lastSuggest.orderbookBuySide?.depthBuy})</span>}</p>
                    <div className={'wrapperForOrderbook'}>
                        {lastSuggest.orderbookBuySide?.asks?.map((e, i) =>
                            <p className={i < lastSuggest.orderbookBuySide?.depthBuy ? 'selectedRow' : ''}
                               key={e[0] + e[1] + i + 'key2'}>
                                <span>{e[0]}</span>
                                <span><abbr title={e[1]}>{e[1].toFixed(2)}</abbr></span>
                            </p>)}
                    </div>
                </div>}

                {history && lastSuggest && <div className={"bidsOrderbook"} style={+hide? { filter: 'blur(1px)' }: {}}>
                    <p className={'tableTitle'}>Buy side bids
                        {lastSuggest.orderbookBuySide &&
                            <span style={{ marginLeft: 5 }}>({lastSuggest.orderbookBuySide?.depthSell})</span>}</p>
                    <div className={'wrapperForOrderbook'}>
                        {lastSuggest.orderbookBuySide?.bids?.map((e, i) =>
                            <p className={i < lastSuggest.orderbookBuySide?.depthSell ? 'selectedRow' : ''}
                               key={e[0] + e[1] + i + 'key3'}>
                                <span>{e[0]}</span>
                                <span><abbr title={e[1]}>{e[1].toFixed(2)}</abbr></span>
                            </p>)}
                    </div>
                </div>}
            </div>

            <div className={'headersBlock'}>
                {(history && lastSuggest?.sellSideName) && <b>{lastSuggest.sellSideName} - 20 rows</b>}
                {(history && lastSuggest?.buySideName) && <b>{lastSuggest.buySideName} - 20 rows</b>}
            </div>
        </div>
    </>
}