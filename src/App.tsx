import { useEffect, useState } from 'react';
import { TItem } from './App.interface.ts';
import { COUNT_ITEMS_BY_PAGE, fetchBrands, fetchData, fetchIds } from './App.api.ts';

const App = () => {
	const [items, setItems] = useState<TItem[]>([]);
	const [fullItems, setFullItems] = useState<TItem[]>([]);
	const [page, setPage] = useState(0);
	const [filterProduct, setFilterProduct] = useState('');
	const [filterPrice, setFilterPrice] = useState('');
	const [filterBrand, setFilterBrand] = useState('');
	const [loadsByFilters, setLoadsByFilters] = useState(false);
	const [isProcessFetching, setIsProcessFetching] = useState(false);
	const [canNextPage, setCanNextPage] = useState(false);
	const [maxAttempts, setMaxAttempts] = useState('');
	const [brands, setBrands] = useState<string[]>([]);
	const [isFilterApplied, setIsFilterApplied] = useState(false);

	useEffect(() => {
		const apply = !!(filterProduct || filterPrice || filterBrand);
		setIsFilterApplied(apply);
		if (!apply && loadsByFilters) clearFilters();
	}, [filterProduct, filterPrice, filterBrand, loadsByFilters]);


	const fetchItems = async (pageLocal = 0, filterProductLocal = '', filterPriceLocal = '', filterBrandLocal = ''): Promise<void> => {
		setItems([]);
		setIsProcessFetching(true);
		const {
			body: ids,
			err: errorId,
			loadsByFiltersLocal,
			canLoadMore,
		} = await fetchIds(filterProductLocal, filterPriceLocal, filterBrandLocal, pageLocal);
		if (errorId) {
			setMaxAttempts(errorId);
			return;
		}
		setCanNextPage(!(canLoadMore as boolean));
		if (loadsByFiltersLocal != undefined) setLoadsByFilters(loadsByFiltersLocal);
		const {
			body: newItems,
			err: errorArray,
		} = await fetchData(filterProductLocal, filterPriceLocal, filterBrandLocal, ids as string[]);
		if (errorArray) {
			setMaxAttempts(errorArray);
			return;
		}
		setFullItems(newItems as TItem[]);
		if (loadsByFiltersLocal === true) {
			const filteredItems = (newItems as TItem[]).slice(0, COUNT_ITEMS_BY_PAGE);
			setItems(filteredItems);
		} else {
			setItems(newItems as TItem[]);
		}
		setIsProcessFetching(false);
	};

	const applyFilterHandler = async () => {
		setPage(0);
		await fetchItems(0, filterProduct, filterPrice, filterBrand);
	};

	const changePage = (operation: '+' | '-') => {
		const newPage = (operation === '+') ? page + 1 : page - 1;
		setPage(newPage);
		if (loadsByFilters) {
			setItems((fullItems as TItem[]).slice(newPage * COUNT_ITEMS_BY_PAGE, (newPage + 1) * COUNT_ITEMS_BY_PAGE));
		} else {
			(async () => {
				await fetchItems(newPage);
			})();
		}
	};

	const clearFilters = (): void => {
		setFilterProduct('');
		setFilterPrice('');
		setFilterBrand('');
		setPage(0);
		(async () => {
			await fetchItems();
		})();
	};

	useEffect(() => {
		(async () => {
			const { body: newBrands, err } = await fetchBrands();
			setBrands(newBrands as string[]);
			setMaxAttempts(err);
		})();

		(async () => {
			await fetchItems();
		})();

	}, []);

	return (
		<div>
			{maxAttempts ? (
				<div className="modal">
					<div className="modal-content">
						<h1>{maxAttempts}</h1>
						<p>
							<i>Убедитесь, что у вас работает интернет и обновите страницу</i>
						</p>
					</div>
				</div>
			) : (
				<div className="valantis-store">
					<div className="filters">
						<div className="filter-container">
							<div className="filter-item">
								<label htmlFor="filterProduct">Название:</label>
								<input
									id="filterProduct"
									value={filterProduct}
									onChange={(e) => setFilterProduct(e.target.value)}
									disabled={isProcessFetching}
								/>
							</div>
							<div className="filter-item">
								<label htmlFor="filterPrice">Цена:</label>
								<input
									id="filterPrice"
									value={filterPrice}
									onChange={(e) => setFilterPrice(e.target.value)}
									disabled={isProcessFetching}
								/>
							</div>
							<div className="filter-item">
								<label htmlFor="filterBrand">Бренд:</label>
								<select
									id="filterBrand"
									value={filterBrand}
									onChange={(e) => setFilterBrand(e.target.value)}
									disabled={isProcessFetching}
								>
									{brands.map((brand) => (
										<option key={brand}>{brand}</option>
									))}
								</select>
							</div>
						</div>
						<div className="button-container">
							<button onClick={applyFilterHandler} disabled={!isFilterApplied}>
								Применить фильтр
							</button>
							<button onClick={clearFilters} disabled={!isFilterApplied}>
								Очистить фильтры
							</button>
						</div>
					</div>
					<div className="products-container">
						{!isProcessFetching ? (
							<table className="products">
								<thead>
								<tr>
									<th>ID</th>
									<th>Название</th>
									<th>Стоимость</th>
									<th>Бренд</th>
								</tr>
								</thead>
								<tbody>
								{items.map((product) => (
									<tr key={product.id}>
										<td>{product.id}</td>
										<td>{product.product}</td>
										<td>{product.price}</td>
										<td>{product.brand}</td>
									</tr>
								))}
								</tbody>
							</table>
						) : (
							<div className="loader">
								<div className="spinner"></div>
								<span>Загрузка данных...</span>
							</div>
						)}
					</div>
					<div className="pagination-container">
						<button onClick={() => changePage('-')} disabled={page < 1 || isProcessFetching}>
							Предыдущая страница
						</button>
						{isFilterApplied && !isProcessFetching &&
							<span>стр. {page + 1} из {Math.ceil(fullItems.length / COUNT_ITEMS_BY_PAGE)}</span>}
						<button onClick={() => changePage('+')}
								disabled={
									isProcessFetching
										? true
										: isFilterApplied
											? ((page + 1) == (Math.ceil(fullItems.length / COUNT_ITEMS_BY_PAGE)) || isProcessFetching)
											: (canNextPage)
								}>
							Следующая страница
						</button>
					</div>
				</div>
			)}
		</div>

	);
};

export default App;
