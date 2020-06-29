import React from "react";
import { apiRequestResult, IDataItem } from "./APIRequestResult";
import mobx, { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import _, { round } from 'lodash';
import { Dropdown, Button } from 'react-bootstrap';
import MarketList from "./MarketList";

export interface IMarket {
	name: string;
	categories: Array<ICategory>;
}
export interface ICategory {
	name: string;
}

export type DisplayMode = 'volumn'|'change';

@observer
export default class MarketWidgetUI extends React.Component {
	@observable
	private data: Array<IDataItem> = [];
	@observable
	private marketAndCategories: Array<IMarket> = [];
	@observable
	private selectedCategory: ICategory | null = null;
	@observable
	private selectedMarket: IMarket | null = null;
	private webSocket = new WebSocket('wss://stream.binance.com/stream?streams=!miniTicker@arr');
	@observable
	private searchTerm: string = '';
	@observable
	private displayMode: DisplayMode = 'change';

	componentDidMount() {
		const fethReqeust = new Request('https://www.binance.com/exchange-api/v1/public/asset-service/product/get-products', {
			method: 'GET',
			mode: 'no-cors',
			headers: {
				"Accept": "application/json"
			}
		});

		fetch(fethReqeust)
			.then((response) => {
				// the server doesn't allow "Cross-Origin Resource Sharing", so I changed to use no-cors, still got response.body returned null, so I had to Mock the api response data for now
				this.data = apiRequestResult.data;
				const markets = _.uniqBy(this.data, 'pm').map(e => e.pm);
				markets.forEach(m => {
					const cats = _.chain(this.data).filter(e => e.pm === m).uniqBy('q').map(e => ({ name: e.q } as ICategory)).value();
					this.marketAndCategories.push({ name: m, categories: (cats.length > 1 ? cats : []) });
				});
				this.marketAndCategories = this.marketAndCategories.sort((a, b) => {
					const aLen = a.categories.length;
					const bLen = b.categories.length;
					if (aLen - bLen > 0) return 1;
					else return -1;
				})

			}).catch((error) => {

			});

		this.webSocket.onmessage = this.receivePushedMessage;
	}

	render () {
		let filteredData: IDataItem[] = [];
		if (!!this.selectedMarket) {
			filteredData = this.data.filter(row => row.pm === this.selectedMarket?.name);
		} else if (!!this.selectedCategory) {
			filteredData = this.data.filter(row => row.q === this.selectedCategory?.name);
		} else {
			filteredData = this.data;
		}
		filteredData = filteredData.filter((row) => {
			return row.s.toLocaleLowerCase().indexOf(this.searchTerm.toLocaleLowerCase()) >= 0;
		});

		return (
			<div className={'market-widget-ui'}>
				<h2 className='title'>Market</h2>
				<div className='filter-panel'>
					<div className='categories'>
						{<Button variant='outline-secondary' onClick={this.onClickMargin}>Margin</Button>}
						{this.marketAndCategories.map(m => {
							if (!!m.categories && !!m.categories.length){
								return (
									<Dropdown key={m.name}>
										<Button variant='outline-secondary' onClick ={() => {this.onClickMarket(m)}}>{m.name}</Button>
										<Dropdown.Toggle variant='outline-secondary' id="dropdown-basic">
										</Dropdown.Toggle>
	
										<Dropdown.Menu>
											{m.categories.map(c => (
												<Dropdown.Item key={c.name} onClick ={() => {this.onClickCategory(c)}}>{c.name}</Dropdown.Item>
											))}
										</Dropdown.Menu>
									</Dropdown>
								);
							} else {
								return <Button variant='outline-secondary' onClick ={() => {this.onClickCategory(m)}}>{m.name}</Button>;
							}

						})}
					</div>
				</div>
				<div className='search-box'>
					<div className="inner-addon left-addon">
						<i className="glyphicon glyphicon-search"></i>
						<input type="text" className="form-control" placeholder="Search" value={this.searchTerm} onChange={this.onSearchChange} />
					</div>
					<div className='radio-group'>
						<input id='change' type='radio' checked={this.displayMode === 'change'} onClick={() => {this.onModeClicked('change')}}></input>
						<label htmlFor='change'>Change</label>
						<input id='volumn' type='radio' checked={this.displayMode === 'volumn'} onClick={() => {this.onModeClicked('volumn')}}></input>
						<label htmlFor='change'>Volumn</label>
					</div>
				</div>
				<div className='list-wrapper'>
					<MarketList data={filteredData} displayMode={this.displayMode}/>
				</div>
			</div>
		);
	}

	@action
	private onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.searchTerm = event.target.value;
	}

	@action
	private onModeClicked = (mode: DisplayMode) => {
		this.displayMode = mode;
	}

	private onClickMargin = () => {
		this.selectedCategory = null;
		this.selectedMarket = null;
	}

	private onClickMarket = (market: IMarket) => {
		this.selectedMarket = market;
		this.selectedCategory = null;
	}

	private onClickCategory = (cat: ICategory) => {
		this.selectedCategory = cat;
		this.selectedMarket = null;
	}

	private onClickCategoryByMarket = (market: IMarket) => {
		this.selectedCategory = market.categories[0];
		this.selectedMarket = null;
	}

	private receivePushedMessage = (event: any) => {
		if (event && event.data) {
			var parsedObj = JSON.parse(event.data);
			parsedObj.data.forEach((row: any) => {
				const found = this.data.find((e) => {
					return e.s === row.s;
				})
				if (found) {
					found.c = row.c;
					found.l = row.l;
					found.o = row.o;
					found.h = row.h;
				}
			});
		}
	}
}