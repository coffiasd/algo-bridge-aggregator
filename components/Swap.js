import { BiSortAlt2, BiCog } from "react-icons/bi";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import { ethers } from 'ethers'
import bridgeConfig from "../utils/bridge_config.json";
import tokensConfig from "../utils/token_config.json";
import { useEffect, useState } from "react";

import styles from '../styles/Home.module.css';
import Image from "next/image";

//alert
import { alertService } from '../services';

import MyAlgoConnect from '@randlabs/myalgo-connect';

import Balance from "./Balance";

import { transferHandle, redeemHandle, algoBalance, algoAssetBalance } from "../bridges/wormhole";
import ERC20ABI from 'erc-20-abi';

export default function Swap() {
    //current bridge.
    const [currentBridge, setcurrentBridge] = useState("wormhole");

    const [signedVAA, setSignedVAA] = useState("");
    //button loading
    const [loading, setLoading] = useState("");

    const [draw, setDraw] = useState(false);

    //default stage 0
    const [stage, setStage] = useState(0);

    // modal
    const [modal, setModal] = useState("");
    const [modalToken, setModalToken] = useState("");
    const [modalToken1, setModalToken1] = useState("");

    //token option
    const [token0, setToken0] = useState(null);
    const [token1, setToken1] = useState(null);

    //token address
    const [token0Addrs, setToken0Addrs] = useState("");
    const [token1Addrs, setToken1Addrs] = useState("");

    //token balance
    const [token0Balance, setToken0Balance] = useState(0);
    const [token1Balance, setToken1Balance] = useState(0);

    //swap amount
    const [swapAmount, setSwapAmount] = useState(0);

    //alert options
    const options = {
        autoClose: true,
        keepAfterRouteChange: false
    }

    useEffect(() => {
        if (token0 != null && token1 != null && swapAmount) {
            setStage(1);
        }
    }, [token0, token1, swapAmount])

    async function connectWallet(network, type) {
        switch (network) {
            case "Algo":
                const myAlgoConnect = new MyAlgoConnect({ disableLedgerNano: false });
                const settings = {
                    shouldSelectOneAccount: true,
                    openManager: false
                };
                const accounts = await myAlgoConnect.connect(settings);
                let balanceAlgo = 0;
                if (tokensConfig[token0].name == "Algo") {
                    //native chaoin
                    balanceAlgo = await algoBalance(accounts[0].address);
                } else {
                    //remote chain
                    balanceAlgo = await algoAssetBalance(accounts[0].address, tokensConfig[token1].tokenAddressOnRemoteChain[tokensConfig[token0].name]);
                }
                if (type == 0) {
                    setToken0Balance(Number(balanceAlgo).toFixed(4));
                    setToken0Addrs(accounts[0].address);
                } else {
                    setToken1Balance(Number(balanceAlgo).toFixed(4));
                    setToken1Addrs(accounts[0].address);
                }
                break;
            case "Ether":
                // window.ethereum.request({
                //     method: "wallet_addEthereumChain",
                //     params: [{
                //         chainId: "0x89",
                //         rpcUrls: ["https://rpc-mainnet.matic.network/"],
                //         chainName: "Matic Mainnet",
                //         nativeCurrency: {
                //             name: "MATIC",
                //             symbol: "MATIC",
                //             decimals: 18
                //         },
                //         blockExplorerUrls: ["https://polygonscan.com/"]
                //     }]
                // });

                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x5' }],
                });

                const provider = new ethers.providers.Web3Provider(window.ethereum)
                const account = await provider.send("eth_requestAccounts", []);
                // console.log(await provider.getBalance(account[0]));
                // const balance = ethers.utils.formatUnits(await provider.getBalance(account[0]), 18);
                let balance = 0;
                if (tokensConfig[token0].name == "Ether") {
                    //native 
                    balance = await provider.getBalance(account[0]);
                    balance = ethers.utils.formatUnits(balance, 18);
                } else {
                    //remote chiain
                    const Xalgo = new ethers.Contract("0x6D52a10BE00Dc81d352d1Ed85323814c29826665", ERC20ABI, provider);
                    balance = await Xalgo.balanceOf(account[0]);
                    balance = ethers.utils.formatUnits(balance, 6);
                }

                if (type == 0) {
                    setToken0Balance(Number(balance).toFixed(4));
                    setToken0Addrs(account[0]);
                } else {
                    setToken1Balance(Number(balance).toFixed(4));
                    setToken1Addrs(account[0]);
                }
                break;
            default:

        }
    }

    //token0 change event.
    async function selectToken0ChangeHandle(index) {
        myModal5ClickHandle();
        if (index > 1) {
            // not ready tokens
            alertService.info("not ready stay tuned");
            return
        }
        if (index == token1) {
            setToken1(null);
            setToken1Addrs("");
            setToken1Balance("");
        }
        setToken0(index);
    }

    //token1 change event.
    async function selectToken1ChangeHandle(index) {
        myModal6ClickHandle();
        if (index > 1) {
            // not ready tokens
            alertService.info("not ready stay tuned");
            return
        }
        if (index == token0) {
            setToken0(null);
            setToken0Addrs("");
            setToken0Balance("");
        }
        setToken1(index);
    }

    /// control modal
    const modalClick = () => {
        if (modal == "") {
            setModal("modal-open");
        } else {
            setModal("");
        }
    }

    const myModal5ClickHandle = () => {
        if (modalToken == "") {
            setModalToken("modal-open");
        } else {
            setModalToken("");
        }
    }

    const myModal6ClickHandle = () => {
        if (modalToken1 == "") {
            setModalToken1("modal-open");
        } else {
            setModalToken1("");
        }
    }

    const bridgeChangeHandle = (index) => {
        setDraw(false);
        console.log(index);
        if (index != 0) {
            alertService.info("not ready stay tuned");
            return
        }
    }

    window.onclick = function (event) {
        var modal5 = document.getElementById('my-modal-5');
        var modal6 = document.getElementById('my-modal-6');
        if (event.target == modal5) {
            myModal5ClickHandle();
        }

        if (event.target == modal6) {
            myModal6ClickHandle();
        }
    }

    function buttonHtml() {
        if (stage == 1) {
            return <button onClick={() => transferHandle(setSignedVAA, swapAmount, tokensConfig[token0], token0Addrs, token1Addrs, alertService, setStage, setLoading)} className={`btn btn-primary w-full normal-case my-5 rounded-xl ${loading}`}>transfer</button>
        } else if (stage == 2) {
            return <button onClick={() => redeemHandle(signedVAA, tokensConfig[token1], token0Addrs, token1Addrs, alertService, setStage, setLoading, swapAmount, setToken0Balance, setToken1Balance, token0Balance, token1Balance)} className={`btn btn-primary w-full normal-case my-5 rounded-xl ${loading}`}>redeem</button>
        } else {
            return <button disabled className="btn btn-primary w-full normal-case my-5 rounded-xl">Input amount</button>
        }
    }

    return (
        <div className="">

            <div className={`modal ${modalToken} cursor-pointer ${styles.modalSelf}`} id="my-modal-5">
                <div className="modal-box bg-base-100">
                    <h3 className="text-lg font-bold">Select Network</h3>
                    <div className="divider"></div>
                    <div className="flex flex-col">

                        {tokensConfig.map((item, key) => (
                            <div className="flex flex-row cursor-pointer hover:bg-warning rounded-2xl p-1" key={key} onClick={() => selectToken0ChangeHandle(key)}>
                                <div>
                                    <Image alt="" src={item.path} width={25} height={25} />
                                </div>
                                <div className="ml-3 text-base">{item.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`modal ${modalToken1} cursor-pointer ${styles.modalSelf}`} id="my-modal-6">
                <div className="modal-box">
                    <h3 className="text-lg font-bold">Select Network</h3>
                    <div className="divider"></div>
                    <div className="flex flex-col">
                        {tokensConfig.map((item, key) => (
                            <div className="flex flex-row h-10 cursor-pointer hover:bg-warning p-2 rounded-2xl" key={key} onClick={() => selectToken1ChangeHandle(key)}>
                                <div className="w-1/12 align-middle">
                                    <Image alt="" src={item.path} width={25} height={25} />
                                </div>
                                <div className="w-9/12 mb-4">
                                    <div>{item.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-56 m-auto mt-20 h-20 p-2">
                <div className="w-auto p-2 flex flex-row border-solid border-2 rounded-2xl cursor-pointer" onClick={() => { setDraw(!draw) }}>
                    <div className="flex ml-1"
                    ><Image alt="" src="/network/wormhole.png" width={24} height={20}></Image>
                    </div>
                    <div className="flex-auto text-center mx-1">{currentBridge}</div>
                    <div className="flex mt-1 mr-2"><BiChevronDown size="1rem" />
                    </div>
                </div>
                {draw && <ul className="menu bg-base-100 w-52 p-2 rounded-box mt-1 fixed">
                    {bridgeConfig.map((item, key) => (
                        <li key={key} onClick={(event) => { bridgeChangeHandle(key) }}><a><Image alt="" src={item.icon} width={20} height={20}></Image>{item.name}</a></li>
                    ))}
                </ul>}
            </div>

            <div className="w-1/4 min-w-max h-auto mt-10 border-solid border-2 rounded-2xl m-auto p-1 text-sm bg-slate-50">

                <div className="w-full px-6 py-4">
                    <span className="">
                        Algo Bridges
                    </span>
                    <BiCog className="cursor-pointer float-right" size="1.5rem" />
                </div>

                <div className="flex flex-col px-5 py-2">
                    <div className="h-auto border-solid border-2 rounded-2xl my-5 p-2">
                        <span className="">
                            From
                        </span>
                        <div className="w-96 flex flex-row p-2 gap-x-32 border border-primary rounded-2xl border-dotted m-3">
                            <div className="w-1/2">
                                {token0 != null ? (<div className="w-auto p-2 flex flex-row border-solid border-2 rounded-2xl cursor-pointer" onClick={myModal5ClickHandle}>
                                    <div className="flex"
                                    ><Image alt="" src={tokensConfig[token0].path} width={20} height={20}></Image>
                                    </div>
                                    <div className="flex-auto text-center mx-1">{tokensConfig[token0].name}</div>
                                    <div className="flex"><BiChevronDown size="1rem" />
                                    </div>
                                </div>) : (<div className="w-auto p-2 flex flex-row border-solid border-2 rounded-2xl px-2 cursor-pointer" onClick={myModal5ClickHandle}>
                                    <div className="flex-auto text-center">select</div>
                                    <div className="flex"><BiChevronDown size="1rem" /></div>
                                </div>)}
                            </div>

                            <div className="w-1/2">
                                {token0 != null ? (<div className="p-2 flex flex-row border-solid border-2 rounded-2xl cursor-pointer" onClick={() => connectWallet(tokensConfig[token0].name, 0)}>
                                    <div className="flex w-6"
                                    ><Image alt="" src={"/wallet/" + tokensConfig[token0].wallet} width={20} height={20}></Image>
                                    </div>
                                    <div className="flex text-center mx-1">Wallet</div>
                                    <div className="flex"><BiChevronDown size="1rem" />
                                    </div>
                                </div>) : ("")}
                            </div>

                        </div>

                        {token0 != null && token0Addrs ? (<Balance index={token0} balance={token0Balance} bridge={currentBridge} network={tokensConfig[token0].name} addrs={token0Addrs} del={setToken0Addrs} />) : ""}


                    </div>
                    <div className="m-auto">
                        <BiSortAlt2 className="cursor-pointer" size="1.4rem" />
                    </div>
                    <div className="h-auto border-solid border-2 rounded-2xl my-5 p-2">
                        <span className="">
                            To
                        </span>
                        <div className="flex flex-row p-2 gap-x-32 border border-primary rounded-2xl border-dotted m-3">
                            <div className="w-1/2">
                                {token1 != null ? (<div className="w-auto p-2 flex flex-row border-solid border-2 rounded-2xl cursor-pointer" onClick={myModal6ClickHandle}>
                                    <div className="flex"
                                    ><Image alt="" src={tokensConfig[token1].path} width={20} height={20}></Image>
                                    </div>
                                    <div className="flex-auto text-center mx-1">{tokensConfig[token1].name}</div>
                                    <div className="flex"><BiChevronDown size="1rem" />
                                    </div>
                                </div>) : (<div className="w-auto p-2 flex flex-row border-solid border-2 rounded-2xl px-2 cursor-pointer" onClick={myModal6ClickHandle}>
                                    <div className="flex-auto text-center">select</div>
                                    <div className="flex"><BiChevronDown size="1rem" /></div>
                                </div>)}
                            </div>

                            <div className="w-1/2">
                                {token1 != null ? (<div className="w-auto p-2 flex flex-row border-solid border-2 rounded-2xl cursor-pointer" onClick={() => connectWallet(tokensConfig[token1].name, 1)}>
                                    <div className="flex w-6"
                                    ><Image alt="" src={"/wallet/" + tokensConfig[token1].wallet} width={20} height={20}></Image>
                                    </div>
                                    <div className="flex-auto text-center mx-1">Connect</div>
                                    <div className="flex"><BiChevronDown size="1rem" />
                                    </div>
                                </div>) : ("")}
                            </div>
                        </div>

                        {token1 != null && token1Addrs ? (<Balance index={token1} balance={token1Balance} bridge={currentBridge} network={tokensConfig[token1].name} addrs={token1Addrs} del={setToken1Addrs} />) : ""}

                    </div>

                    <div className="h-auto border-solid border-2 rounded-2xl my-5 p-2">
                        <input type="text" placeholder="Input amount" value={swapAmount} className="font-bold text-primary input input-ghost w-full max-w-xs focus:outline-0 focus:bg-inherit focus:text-primary" onChange={(event) => { if (event.target.value < token0Balance) { setSwapAmount(event.target.value) } }} />
                    </div>

                    <div>
                        {buttonHtml()}
                    </div>
                </div>

            </div>
        </div >
    )
}