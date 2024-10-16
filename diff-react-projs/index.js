import { Toast } from "primereact/toast";
import { observer } from "mobx-react-lite";
import { Button } from "primereact/button";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { DialogCreate } from "./dialogCreate";
import { WebsocketContext } from '../../socket/provider';
import { watchers } from "../../store/watchers";
import {deleteWatcher, forceProcessWatcher, getMyWatchers, runWatcher, updateWatcher} from "../../helpers/watchers";
import { InfoIcon } from "../../icons/ArrowSquareRight";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from 'primereact/checkbox';
import { Tooltip } from "primereact/tooltip";
import { OrderBook } from "./orderBook";

import './index.sass';
const initEdit = { _id: '', min_spread_percentage: '', min_usdt_amount: '', isTesting: false, useDepth: false, allowLimitOrders: false };

const WatchersWrapper =  observer(({ watchers }) => {
    const { stats, subscribe } = useContext(WebsocketContext);

    const toast = useRef(null);
    const [toggleInfo, setToggleInfo] = useState(false);
    const [openStatusWindows, setOpenStatusWindows] = useState(false);
    const [formData, setFormData] = useState(initEdit);

    const subscribeHandler = useCallback(el => {
        subscribe(el._id, async (data, continueRunning, processing) => {
            watchers.setWatchersHistory(el._id, data);
            watchers.mutateProcessing(el._id, processing);
            if (!continueRunning) {
                toast?.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Watcher ' + el.title + ' successfully finished the job'
                });

                watchers.mutateActivePropActive(el._id, false);
            }
        })
    }, [subscribe, watchers]);

    useEffect(() => {
        (async () => {
            const res = await getMyWatchers({
                sorted: 'dateCreated:-1',
                paginate: {
                    first: 0,
                    rows: 50
                }
            });

            if(res.data) {
                watchers.setWatchers(res.data);
                res.data.forEach(subscribeHandler);
            }
        })();
    }, [watchers, subscribe, subscribeHandler]);

    const activate = useCallback(async (el, isActive) => {
        const response = await runWatcher(el._id, isActive);

        toast?.current?.show({
            severity: response.message? 'success': 'error',
            summary: response.message? 'Success': 'Error',
            detail: response.message? response.message: response.error
        });

        watchers.mutateActivePropActive(el._id,response.message? isActive: !isActive);
    }, [toast, watchers]);

    const process = useCallback(async (el, forceProcess) => {
        const response = await forceProcessWatcher(el._id, forceProcess);

        toast?.current?.show({
            severity: response.message? 'success': 'error',
            summary: response.message? 'Success': 'Error',
            detail: response.message? response.message: response.error
        });
        response.message && watchers.mutateActivePropActive(el._id,false);
    }, [toast, watchers]);

    const removeWatcher = useCallback(async el => {
        const response = await deleteWatcher(el._id);
        response.status === 200 && watchers.removeFromList(el._id);

        toast?.current?.show({
            severity: response.status === 200? 'success': 'error',
            summary: response.status === 200? 'Success': 'Error',
            detail: response.status === 200? response.data.message: response.response?.data?.error
        });
    }, [watchers]);

    const edit = async () => {
        if(!watchers?.isActiveEditing) {
            setFormData({
                _id: watchers?.activeTab?._id,
                min_spread_percentage: watchers?.activeTab?.min_spread_percentage,
                min_usdt_amount: watchers?.activeTab?.min_usdt_amount,
                useDepth: watchers?.activeTab?.useDepth,
                isTesting: watchers?.activeTab?.isTesting,
                allowLimitOrders: watchers?.activeTab?.allowLimitOrders,
            });
            watchers?.toggleActiveEditing();
        }

        if((!formData?.min_spread_percentage || !formData?.min_usdt_amount) && watchers?.isActiveEditing) {
            return;
        }

        const res = await updateWatcher(formData);
        if(!res._id) {
            toast?.current?.show({
                severity: res.message? 'success': 'error',
                summary: res.message? 'Success': 'Error',
                detail: res.message? res.message: res.error[0]?.message
            });
        }

        watchers?.toggleActiveEditing(res?._id? res : null);
        setFormData(initEdit);
    };

    const confirmDelete = (el) => {
        confirmDialog({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept: () => removeWatcher(el),
            reject: () => {}
        });
    };

    const history = watchers?.history?.get(watchers?.activeTab?._id);

    const lastSuggest = (history || []).find(e => !!e.sellSideName);

    return <div className={'watchers-page'}>
        <Toast ref={toast}/>
        <ConfirmDialog  />

        <div className="flex align-items-center gap-2 px-2  mobile-wrapper">
            <h1>Watchers page</h1>
            <DialogCreate toast={toast} subscribeHandler={subscribeHandler} />
        </div>

        <div className="flex overflow-hidden">
            <div style={{ flexBasis: '50%', width: '50%' }} className="rounded-box flex-grow-1 flex-shrink-1 p-4 m-3 border-round">
                <h4 style={{ margin: 0 }}>Watchers information
                    <i className={"pi " + (!toggleInfo? "pi-book": "pi-info-circle")}
                       onClick={() => setToggleInfo(!toggleInfo)}
                       style={{
                           color: watchers?.activeTab?.isActive? '#f01515' : 'black',
                           cursor: 'pointer', marginLeft: 10
                        }}
                    ></i>
                    {history && !history[0].message && watchers?.activeTab?.isActive && <>
                        <i className={"pi pi-money-bill processTransaction"}
                            style={{ cursor: 'pointer', float: "right" }}
                            onClick={() => process(watchers?.activeTab, true)}
                        ></i>
                        <Tooltip
                            position={'left'}
                            target=".processTransaction"
                            mouseTrack
                            mouseTrackLeft={10}>
                            If you click here it WILL PROCESS TRANSACTION RIGHT NOW!!!!
                        </Tooltip>
                    </>}
                </h4>

                {watchers?.activeTab && !toggleInfo && <div>
                    <div className="flex align-items-center" style={{margin: '20px 0 10px 0', height: 45}}>
                        <InfoIcon/>
                        <span>{watchers?.activeTab?.title}</span>

                        <div style={{margin: '0 20px'}} className={"forTestingModBlock"}>
                            <Tooltip target=".isTesting" mouseTrack mouseTrackLeft={10}>
                                <div style={{textAlign: 'center'}}>
                                    {watchers.isActiveEditing && watchers?.activeTab?.isTesting !== formData.isTesting ?
                                        <div>PLEASE SAVE CHANGES</div> : <div>
                                            <div>Now testing mode is {(watchers?.activeTab?.isTesting ? "ENABLED" : "DISABLED")}</div>
                                            <div style={{color: '#ffed2c'}}>
                                                System will process transactions on {watchers?.activeTab?.isTesting ? 'WITHOUT MONEY' : 'REAL MONEY'}!
                                            </div>
                                            {watchers?.activeTab?.isTesting &&
                                                <div style={{color: '#ffed2c'}}>USING JUST HISTORY!</div>}
                                        </div>}
                                </div>
                            </Tooltip>

                            <Checkbox
                                disabled={!watchers?.isActiveEditing}
                                className="isTesting"
                                inputId="isTesting"
                                name="isTesting"
                                onChange={e => {
                                    setFormData(prev => ({
                                        ...prev,
                                        isTesting: e.checked
                                    }))
                                }}
                                checked={watchers?.isActiveEditing ? formData.isTesting : watchers?.activeTab?.isTesting}
                            />
                        </div>

                        <div style={{margin: '0 20px 0 0'}} className={"forDepthModBlock"}>
                            <Tooltip target=".useDepth" mouseTrack mouseTrackLeft={10}>
                                <div style={{textAlign: 'center'}}>
                                    {watchers.isActiveEditing && watchers?.activeTab?.useDepth !== formData.useDepth ?
                                        <div>PLEASE SAVE CHANGES</div> : <div>
                                            <div>Now using depth mode is {(watchers?.activeTab?.useDepth ? "ENABLED" : "DISABLED")}</div>
                                            <div style={{color: '#ffed2c'}}>
                                                For percentage calculations will be used {watchers?.activeTab?.useDepth ? ' ORDERBOOK' : ' SPREAD'}!
                                            </div>
                                            {watchers?.activeTab?.useDepth &&
                                                <div style={{color: '#ffed2c'}}>VOLUMES WILL ALWAYS BE GREEN!</div>}
                                        </div>}
                                </div>
                            </Tooltip>

                            <Checkbox
                                disabled={!watchers?.isActiveEditing}
                                className="useDepth"
                                inputId="useDepth"
                                name="useDepth"
                                onChange={e => {
                                    setFormData(prev => ({
                                        ...prev,
                                        useDepth: e.checked
                                    }))
                                }}
                                checked={watchers?.isActiveEditing ? formData.useDepth : watchers?.activeTab?.useDepth}
                            />
                        </div>

                        <div  className={"forLimitsModBlock"}>
                            <Tooltip target=".allowLimitOrders" mouseTrack mouseTrackLeft={10}>
                                <div style={{ textAlign: 'center' }}>
                                    {watchers.isActiveEditing && watchers?.activeTab?.allowLimitOrders !== formData.allowLimitOrders ?
                                        <div>PLEASE SAVE CHANGES</div> : <div>
                                            <div>Now watcher will create {(watchers?.activeTab?.allowLimitOrders ? "LIMIT" : "MARKET")} order!</div>
                                            <div style={{color: '#ffed2c'}}>
                                                System will try to process transactions {watchers?.activeTab?.allowLimitOrders ? 'WITH CURRENT' : 'WITHOUT'} price!
                                            </div>
                                            {watchers?.activeTab?.allowLimitOrders &&
                                                <div style={{color: '#ffed2c'}}>USING STRICT PRICES!</div>}
                                        </div>}
                                </div>
                            </Tooltip>

                            <Checkbox
                                disabled={!watchers?.isActiveEditing}
                                className="allowLimitOrders"
                                inputId="allowLimitOrders"
                                name="allowLimitOrders"
                                onChange={e => {
                                    setFormData(prev => ({
                                        ...prev,
                                        allowLimitOrders: e.checked
                                    }))
                                }}
                                checked={watchers?.isActiveEditing ? formData.allowLimitOrders : watchers?.activeTab?.allowLimitOrders}
                            />
                        </div>
                    </div>

                    <div className="flex align-items-center" style={{margin: '10px 0', height: 45}}>
                        <InfoIcon/>
                        <span>{watchers?.activeTab?.tickerFirstId?.t} - {watchers?.activeTab?.tickerFirstId?.target}</span>

                        <i className="pi pi-arrow-right-arrow-left" style={{fontSize: '1rem', margin: '0 10px'}}></i>
                        <span>{watchers?.activeTab?.tickerSecondId?.t} - {watchers?.activeTab?.tickerSecondId?.target}</span>
                    </div>

                    <div className="flex align-items-center" style={{margin: '10px 0', height: 45}}>
                        <InfoIcon/>
                        <span>
                            Min percentage:
                            {watchers?.isActiveEditing ?
                                <InputNumber
                                    minFractionDigits={1}
                                    min={0.1}
                                    max={20}
                                    value={formData.min_spread_percentage}
                                    onChange={e => {
                                        setFormData(prev => ({
                                            ...prev,
                                            min_spread_percentage: e.value
                                        }))
                                    }}
                                /> : <b> {watchers?.activeTab?.min_spread_percentage} %</b>}
                        </span>
                    </div>

                    <div className="flex align-items-center" style={{margin: '10px 0', height: 45}}>
                        <InfoIcon/>
                        <span>Min volume:
                            {watchers?.isActiveEditing ?
                                <InputNumber
                                    value={formData.min_usdt_amount}
                                    onChange={e => {
                                        setFormData(prev => ({
                                            ...prev,
                                            min_usdt_amount: e.value
                                        }))
                                    }}
                                /> :
                                <b> {watchers?.activeTab?.min_usdt_amount} $</b>}
                        </span>
                    </div>

                    <div className="flex align-items-center" style={{margin: '20px 0 0 0'}}>
                        <Button
                            onClick={() => activate(watchers?.activeTab, true)}
                            className={'button-extra-padding'}
                            disabled={watchers?.activeTab?.processing || watchers?.isActiveEditing || watchers?.activeTab?.isActive || !watchers?.activeTab?._id}
                            severity="success"
                            aria-label="Start">
                            Start
                        </Button>
                        <Button
                            onClick={() => activate(watchers?.activeTab, false)}
                            disabled={watchers?.activeTab?.processing || !watchers?.activeTab?.isActive}
                            severity="danger"
                            style={{padding: '10px 20px', marginLeft: 15}}
                            aria-label="Stop">
                            Stop
                        </Button>
                        <Button
                            onClick={edit}
                            className={'button-extra-padding'}
                            style={{marginLeft: 15}}
                            disabled={watchers?.activeTab?.processing || watchers?.activeTab?.isActive || !watchers?.activeTab?._id}
                            severity="secondary"
                            aria-label={watchers?.isActiveEditing ? 'Save' : 'Edit'}>
                            {watchers?.isActiveEditing ? 'Save' : 'Edit'}
                        </Button>
                    </div>
                </div>}

                {watchers?.activeTab && toggleInfo && <OrderBook lastSuggest={lastSuggest} history={history} />}
            </div>

            <div style={{flexBasis: '50%', width: '50%'}} className="rounded-box flex-grow-1 flex-shrink-1 p-4 m-3 border-round">
                <h4 style={{ position: 'relative', margin: 0 }}>
                    All watchers ({watchers?.data?.length} from 50)
                </h4>

                <div className="grid desktop-info-block"
                     style={{borderBottom: '1px solid #D7D7D7', color: '#7C7C7C', margin: '10px 0'}}>
                    <div className="col-4">
                        <div className="text-center">Name</div>
                    </div>
                    <div className="col-4">
                        <div className="text-center">Stock exchange</div>
                    </div>
                    <div className="col-2">
                        <div className="text-center">Status</div>
                    </div>
                    <div className="col-2">
                        <div className="text-center"></div>
                    </div>
                </div>

                <div className="grid mobile-info-block"
                     style={{
                         borderBottom: '1px solid #D7D7D7',
                         color: '#7C7C7C', margin: '10px 0'
                     }}>
                    <div className="col-5">
                        <div className="text-center">Title</div>
                    </div>
                    <div className="col-5">
                        <div className="text-center">Status</div>
                    </div>
                    <div className="col-2">
                        <div className="text-center"></div>
                    </div>
                </div>

                <div className={'watchers-list'} style={{maxHeight: 234, overflowX: 'hidden', overflowY: 'auto'}}>
                    {watchers?.data?.map(el => (
                        <div
                            onClick={() => {
                                if (!el.tickerFirstId || !el.tickerSecondId) return;
                                watchers?.setActiveTab(el);
                                setToggleInfo(false);
                            }}
                            className="grid"
                            style={{
                                cursor: !el.tickerFirstId || !el.tickerSecondId ? 'default' : 'pointer',
                                opacity: !el.tickerFirstId || !el.tickerSecondId ? .2 : 1
                            }}
                            key={el?._id + '-tab-list'}
                        >
                            <div
                                className={"col-4 desktop-info-block" + (watchers?.activeTab?._id === el?._id ? ' current-tab' : '')}>
                                <div className="text-left p-1">
                                    <i className={"pi " + (watchers?.activeTab?._id === el._id ? 'pi-check' : 'pi-minus')}
                                       style={{marginRight: 20}}></i>
                                    <b>{el?.tickerFirstId?.t}</b>
                                </div>
                            </div>
                            <div
                                className={"col-4 desktop-info-block" + (watchers?.activeTab?._id === el?._id ? ' current-tab' : '')}
                                style={{textTransform: 'capitalize'}}>
                                <div className="text-center p-1">
                                    <b>{el?.tickerFirstId?.target} + {el?.tickerSecondId?.target}</b>
                                </div>
                            </div>

                            <div
                                className={"col-5 mobile-info-block" + (watchers?.activeTab?._id === el?._id ? ' current-tab' : '')}
                                onClick={() => watchers?.setActiveTab(el)}>
                                <div className="text-left p-1">
                                    <b>{el?.title}</b>
                                </div>
                            </div>

                            <div className="col-2 desktop-info-block">
                                <div className={"text-center badges-style" + (el?.isActive ? ' launched' : '')}>
                                    {el?.isActive ? 'Launched' : 'Stopped'}
                                </div>
                            </div>

                            <div className="col-5 mobile-info-block justify-content-around">
                                <div className={"text-center badges-style" + (el?.isActive ? ' launched' : '')}>
                                    {el?.isActive ? 'Launched' : 'Stopped'}
                                </div>
                            </div>

                            <div className="col-2">
                                <div className="text-center p-1">
                                    {el.processing?
                                        <i className="pi pi-spin pi-spinner" style={{ marginLeft: 10, fontSize: '1rem' }}></i> :
                                        <Button
                                            icon="pi pi-times"
                                            rounded
                                            text
                                            severity="danger"
                                            aria-label="Delete"
                                            style={{width: 20, height: 20, padding: 0, border: 0, marginLeft: 10}}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmDelete(el);
                                            }}
                                        />
                                    }
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex overflow-hidden">
            <div className="rounded-box flex-grow-1 flex-shrink-1 m-3 border-round">
                <h4 style={{margin: 0}} className={'flex justify-content-between align-items-center p-4'}>
                    <div className={'flex'}>
                        <b className={'eventsLabel'}>Events</b>
                        <Button
                            icon="pi pi-sync"
                            rounded
                            text
                            severity="danger"
                            aria-label="Cancel"
                            style={{width: 20, height: 20, padding: 0, border: 0, marginLeft: 10}}
                            onClick={() => watchers?.clearHistory(watchers?.activeTab?._id)}
                        />

                        <div className="flex align-items-center" style={{fontWeight: 600, marginLeft: 20}}>
                            <div>
                                <span>
                                    {watchers?.activeTab?.tickerFirstId?.t} - {watchers?.activeTab?.tickerFirstId?.target}
                                </span>
                                <i className="pi pi-arrow-right-arrow-left"
                                   style={{fontSize: '1rem', margin: '0 10px'}}></i>
                                <span>
                                    {watchers?.activeTab?.tickerSecondId?.t} - {watchers?.activeTab?.tickerSecondId?.target}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ position: "relative" }}>
                        <Button
                            icon="pi pi-cog"
                            rounded
                            text
                            severity="info"
                            aria-label="Open config"
                            style={{width: 20, height: 20, padding: 0, border: 0, marginLeft: 10}}
                            onClick={() => setOpenStatusWindows(!openStatusWindows)}
                        />
                        <div className={'configBlock ' + (openStatusWindows? 'active' : '')}>
                            {!stats?.cexStats && <div>Here will be a statistic of memory usage</div>}
                            {stats?.cexStats && <div>
                                <p>Workers: {stats?.systemStats}</p>
                                <table className={'statsTable'}>
                                    <tbody>
                                        {stats?.cexStats?.map((el, i) => {
                                            return <tr key={el.target + i + 'stats'}>
                                                <td style={{width: 100}}>{el.target}</td>
                                                <td style={{width: 30}}>{el.eventData}</td>
                                                <td style={{width: 30}}>{el.subscribedTickers}</td>
                                            </tr>
                                        })}

                                        {stats?.cexStats?.reduce((state, el) => [{
                                            eventData: state[0].eventData + el.eventData,
                                            subscribedTickers: state[0].subscribedTickers + el.subscribedTickers
                                        }],
                                        [{ eventData: 0, subscribedTickers: 0 }]).map((el, i) =>
                                            <tr key={el.target + i + 'stats'}>
                                                <td style={{width: 100}}></td>
                                                <td style={{width: 30}}>{el.eventData}</td>
                                                <td style={{width: 30}}>{el.subscribedTickers}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>}
                        </div>
                    </div>
                </h4>

                <div className={'logs-container'}>
                    {history?.map((el, i) => {
                        const hours = new Date(el.eventTime).getHours(),
                            minutes = new Date(el.eventTime).getMinutes(),
                            seconds = new Date(el.eventTime).getSeconds(),
                            time = hours + ':' + minutes + ':' + (seconds > 9 ? seconds : '0' + seconds);

                        return <p key={watchers?.activeTab?._id + i}>
                            {!el.result && !el.message && <span>
                                <b>{time} </b>
                                <span> {el.sellSideName} sell <b>{el.sellSidePrice} </b></span>
                                <span> {el.buySideName} buy <b>{el.buySidePrice} </b></span>

                                <span> Time {el.firstCEX} </span>
                                <span><b><small className={el.timeDifferenceFirst < 1500 ? "success" : "error"}>
                                    {el.timeDifferenceFirst} > 1500
                                </small></b></span>

                                <span> Time {el.secondCEX} </span>
                                <span><b><small className={el.timeDifferenceSecond < 1500 ? "success" : "error"}>
                                    {el.timeDifferenceSecond} > 1500
                                </small></b></span>

                                <span> Percentage </span>
                                <span><b><small className={el.percentageGood ? "success" : "error"}>
                                    {el.percentageDiff} %
                                </small></b></span>

                                <span> Volumes </span>
                                <span>
                                    <b><small className={el.volumeSellGood? "success" : "error"}>
                                        sell {el.volumeCostsForSelling}
                                    </small></b>
                                    <span> - </span>
                                    <b><small className={el.volumeBuyGood? "success" : "error"}>
                                        buy {el.volumeCostsForBuying}
                                    </small></b>
                                </span>

                                <span style={{ display: 'block' }} className="margin-left">
                                    Profit = <b>{el.profit}</b> in coins on buy side
                                </span>
                            </span>}
                            {el.message && <span>{el.message}</span>}
                            {el.result && <span>
                                <span style={{ display: 'block' }}>
                                    {el.result[0] instanceof Object? JSON.stringify(el.result[0]) : el.result[0]}
                                </span>
                                <span style={{ display: 'block' }}>
                                    {el.result[1] instanceof Object? JSON.stringify(el.result[1]) : el.result[1]}
                                </span>
                            </span>}
                        </p>
                    })}
                </div>
            </div>
        </div>
    </div>
})

export const Watchers = () => <WatchersWrapper watchers={watchers}/>;
