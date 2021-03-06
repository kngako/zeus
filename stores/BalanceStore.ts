import { action, reaction, observable } from 'mobx';
import axios from 'axios';
import Transaction from './../models/Transaction';
import SettingsStore from './SettingsStore';

export default class BalanceStore {
    @observable public totalBlockchainBalance: number = 0;
    @observable public confirmedBlockchainBalance: number = 0;
    @observable public unconfirmedBlockchainBalance: number = 0;
    @observable public loading: boolean = false;
    @observable public error: boolean = false;
    @observable public transactions: Array<Transaction> = [];
    @observable public pendingOpenBalance: number = 0;
    @observable public lightningBalance: number = 0;
    settingsStore: SettingsStore;
    getBlockchainBalanceToken: any;
    getLightningBalanceToken: any;

    constructor(settingsStore: SettingsStore) {
        this.settingsStore = settingsStore;
        this.getBlockchainBalanceToken = axios.CancelToken.source().token;
        this.getLightningBalanceToken = axios.CancelToken.source().token;

        reaction(
            () => this.settingsStore.settings,
            () => {
                this.getBlockchainBalance();
                this.getLightningBalance();
            }
        );
    }

    @action
    public getBlockchainBalance = () => {
        const { settings } = this.settingsStore;
        const { host, port, macaroonHex } = settings;

        this.loading = true;
        axios.request({
            method: 'get',
            url: `https://${host}:${port}/v1/balance/blockchain`,
            headers: {
                'Grpc-Metadata-macaroon': macaroonHex
            },
            cancelToken: this.getBlockchainBalanceToken
        }).then((response: any) => {
            // handle success
            const data = response.data;
            this.unconfirmedBlockchainBalance = Number(data.unconfirmed_balance);
            this.confirmedBlockchainBalance = Number(data.confirmed_balance);
            this.totalBlockchainBalance = Number(data.total_balance);
            this.loading = false;
        })
        .catch((error: Error) => {
            // handle error
            this.unconfirmedBlockchainBalance = 0;
            this.confirmedBlockchainBalance = 0;
            this.totalBlockchainBalance = 0;
            this.loading = false;
            console.log('errrrrr');
            console.log(error);
        });
    }

    @action
    public getLightningBalance = () => {
        const { settings } = this.settingsStore;
        const { host, port, macaroonHex } = settings;

        this.loading = true;
        axios.request({
            method: 'get',
            url: `https://${host}:${port}/v1/balance/channels`,
            headers: {
                'Grpc-Metadata-macaroon': macaroonHex
            },
            cancelToken: this.getLightningBalanceToken
        }).then((response: any) => {
            // handle success
            const data = response.data;
            this.pendingOpenBalance = Number(data.pending_open_balance);
            this.lightningBalance = Number(data.balance);
            this.loading = false;
        })
        .catch(() => {
            // handle error
            this.pendingOpenBalance = 0;
            this.lightningBalance = 0;
            this.loading = false;
        });
    }
}