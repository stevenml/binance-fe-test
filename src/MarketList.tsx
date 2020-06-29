import React from "react";
import { apiRequestResult, IDataItem } from "./APIRequestResult";
import mobx, { observable } from 'mobx';
import { observer } from 'mobx-react';
import _, { round } from 'lodash';
import { Dropdown, Button, Table } from 'react-bootstrap';
import { DisplayMode } from "./MarketWidgetUI";

export interface IMarketListProps {
	data: IDataItem[];
	displayMode: DisplayMode;
}

@observer
export default class MarketList extends React.Component<IMarketListProps> {
	componentDidMount() {
		
	}

	render () {
		const data  = this.props.data;
		return (
			<div className='market-list'>
				<Table responsive="md">
					<thead>
						<tr>
							<th>Pair</th>
							<th>Last Price</th>
							<th>Change</th>
						</tr>
					</thead>
					<tbody>
						{data.map((row) => {
							const pair = `${row.b}/${row.pm}`;
							const lastPrice = row.o;
							const latestPrice = row.c;
							let change = null;
							let volumn = null;
							
							if (lastPrice !== 0 && latestPrice !== null && lastPrice !== null) {
								const percentage = round(((latestPrice || 0) - lastPrice) * 10000 / lastPrice) / 100;
								if (percentage >= 0) {
									change = <span className="up">{`${percentage.toString()}%`}</span>;
									volumn = <span className="up">{`${latestPrice.toString()}`}</span>;
								} else {
									change = <span className="down">{`${percentage.toString()}%`}</span>;
									volumn = <span className="down">{`${latestPrice.toString()}`}</span>;
								}
							} else {
								change = <span>"--"</span>;
								volumn = <span>{latestPrice}</span>
							}
							
							return (
								<tr key={`${row.s}`}>
									<td>{pair}</td>
									<td>{lastPrice || ''}</td>
									<td>{this.props.displayMode === 'volumn' ? volumn : change}</td>
								</tr>
							)
						})}
					</tbody>
				</Table>
			</div>
		);
	}


}