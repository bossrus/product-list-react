import axios from 'axios';
import CryptoJS from 'crypto-js';
import { TFetchIDsOrBrandsResult, TFetchDataResult, TItem, TParams, TData } from './App.interface.ts';

const URL = 'http://api.valantis.store:40000/';
const FAIL_COUNT = 5;
const PASSWORD = 'Valantis';
export const COUNT_ITEMS_BY_PAGE = 50;

const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const XAuth = CryptoJS.MD5(`${PASSWORD}_${date}`).toString();


export const fetchIds = async (filterProduct: string, filterPrice: string, filterBrand: string, page: number, attempt = 1): Promise<TFetchIDsOrBrandsResult> => {
	const ids: string[] = [];
	let err: string = '';
	let loadsByFilters: boolean = false;
	let canLoadMore: boolean = false;
	try {
		const filterParams: TParams = {};
		if (filterProduct) filterParams.product = filterProduct;
		if (Object.keys(filterParams).length === 0 && filterPrice) filterParams.price = parseFloat(filterPrice);
		if (Object.keys(filterParams).length === 0 && filterBrand) filterParams.brand = filterBrand;

		const data: TData = {};
		if (Object.keys(filterParams).length > 0) {
			data.action = 'filter';
			data.params = filterParams;
			loadsByFilters = true;
		} else {
			data.action = 'get_ids';
			data.params = { offset: page * COUNT_ITEMS_BY_PAGE, limit: COUNT_ITEMS_BY_PAGE };
			loadsByFilters = false;
		}


		const response = await axiosPost(data) as string[];
		canLoadMore = response.length === COUNT_ITEMS_BY_PAGE;

		response.forEach((id: string) => {
			if (!ids.includes(id)) ids.push(id);
		});
	} catch (error) {
		console.error(`Ошибка при попытке получить IDs №${attempt}:\n${error}`);
		if (attempt < FAIL_COUNT) {
			return await fetchIds(filterProduct, filterPrice, filterBrand, page, attempt + 1);
		} else {
			err = 'Превышено количество попыток получить IDs';
		}
	}
	return {
		body: ids,
		loadsByFiltersLocal: loadsByFilters,
		err,
		canLoadMore,
	};
};

export const fetchData = async (filterProduct: string, filterPrice: string, filterBrand: string, ids: string[], attempt = 1): Promise<TFetchDataResult> => {
	const newItems: TItem[] = [];
	let newItemsFiltered: TItem[] = [];
	let newItemsFinal: TItem[] = [];
	let err: string = '';
	const data: TParams = {
		action: 'get_items',
		params: { ids: ids },
	};
	try {
		const itemsResponse = await axiosPost(data) as TItem[];
		itemsResponse.forEach((item: TItem) => {
			if (item && !newItems.find((i) => 'id' in (i as TItem) && (i as TItem).id === item.id)) {
				newItems.push(item);
			}
		});

		newItemsFiltered = newItems;
		if (filterProduct !== '' && filterPrice !== '') {
			newItemsFiltered = newItems.filter(item => item.price === parseFloat(filterPrice));
		}

		newItemsFinal = newItemsFiltered;
		if ((filterProduct !== '' || filterPrice !== '') && filterBrand !== '') {
			newItemsFinal = newItemsFiltered.filter(item => item.brand === filterBrand);
		}

	} catch (error) {
		console.error(`Ошибка при попытке получить продукты по их ID №${attempt}:\n${error}`);
		if (attempt < FAIL_COUNT) {
			return await fetchData(filterProduct, filterPrice, filterBrand, ids, attempt + 1);
		} else {
			err = `Превышено количество попыток получить продукты по их ID`;
		}
	}
	return {
		body: newItemsFinal,
		err,
	};
};

export const fetchBrands = async (attempt = 1): Promise<TFetchIDsOrBrandsResult> => {
	const newItems: string[] = [''];
	let err: string = '';
	const data: TParams = {
		action: 'get_fields',
		params: { field: 'brand' },
	};
	try {
		const itemsResponse = await axiosPost(data) as string[];
		itemsResponse.forEach((item: string) => {
			if (item && !newItems.includes(item)) {
				newItems.push(item);
			}
		});
	} catch (error) {
		console.error(`Ошибка при попытке получить список брендов №${attempt}:\n${error}`);
		if (attempt < FAIL_COUNT) {
			return await fetchBrands(attempt + 1);
		} else {
			err = `Превышено количество попыток получить список брендов`;
		}
	}
	return {
		body: newItems,
		err,
	};
};

const axiosPost = async (data: TData): Promise<TItem[] | string[]> => {
	const res = await axios.post(
		URL,
		data,
		{
			headers: { 'X-Auth': XAuth },
		},
	);
	return res.data.result;
};