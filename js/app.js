(() => {
    'use strict';
    document.documentElement.classList.add('js');

    const products = [
        {
            id: 'mouse', category: 'mouse', categoryName: 'Мыши', name: 'Click M1',
            title: 'Мышь Click M1', url: 'mouse.html', image: 'images/mouse-studio.webp',
            alt: 'Беспроводная мышь Click M1',
            description: 'Свобода движения. Всё необходимое для повседневной работы.',
            summary: 'Беспроводная · 3 кнопки', connection: 'USB-приёмник',
            wireless: true, features: '3 кнопки', power: 'Батарейка AA',
            type: 'Беспроводная мышь', purpose: 'Работа и повседневные задачи'
        },
        {
            id: 'keyboard', category: 'keyboard', categoryName: 'Клавиатуры', name: 'Type K1',
            title: 'Клавиатура Type K1', url: 'keyboard.html', image: 'images/keyboard-studio.webp',
            alt: 'Полноразмерная клавиатура Type K1',
            description: 'Место для каждой клавиши. Полный формат для ваших мыслей.',
            summary: 'Проводная · 104 клавиши', connection: 'Проводное USB',
            wireless: false, features: '104 клавиши · цифровой блок', power: 'От USB',
            type: 'Мембранная клавиатура', purpose: 'Текст, таблицы и повседневные задачи'
        },
        {
            id: 'headphones', category: 'headphones', categoryName: 'Наушники', name: 'Sound H1',
            title: 'Наушники Sound H1', url: 'headphones.html', image: 'images/headphones-studio.webp',
            alt: 'Полноразмерные наушники Sound H1',
            description: 'Ваше пространство звука. Для музыки, разговоров и концентрации.',
            summary: 'Закрытые · с микрофоном', connection: 'Разъём 3,5 мм',
            wireless: false, features: 'Встроенный микрофон', power: 'Проводное подключение',
            type: 'Закрытые наушники', purpose: 'Музыка и общение'
        }
    ];
    const byId = new Map(products.map(product => [product.id, product]));
    const storageKeys = { favorites: 'periphery:favorites:v1', compare: 'periphery:compare:v1' };
    const memoryStorage = new Map();
    const readIds = key => {
        let value;
        try {
            value = localStorage.getItem(key);
            if (value === null) memoryStorage.delete(key);
            else memoryStorage.set(key, value);
        } catch {
            value = memoryStorage.get(key) || '[]';
        }
        try {
            const parsed = JSON.parse(value || '[]');
            return new Set(Array.isArray(parsed) ? parsed.filter(id => byId.has(id)) : []);
        } catch {
            return new Set();
        }
    };
    const writeIds = (key, values) => {
        const value = JSON.stringify([...values]);
        memoryStorage.set(key, value);
        try { localStorage.setItem(key, value); } catch { /* Selection remains usable in this tab. */ }
    };
    let favorites = readIds(storageKeys.favorites);
    let compared = readIds(storageKeys.compare);
    const state = { category: 'all', search: '', sort: 'default', favoritesOnly: false };
    const grids = [...document.querySelectorAll('[data-product-grid]')];
    const searchInputs = [...document.querySelectorAll('[data-search]')];
    const filterButtons = [...document.querySelectorAll('[data-filter]')];
    const compareDialog = document.getElementById('compare-dialog');
    const compareContent = document.querySelector('[data-compare-content]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let toastTimer;

    const escapeHTML = text => String(text).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    const heartIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
    const toast = message => {
        const target = document.querySelector('[data-toast]');
        if (!target) return;
        window.clearTimeout(toastTimer);
        target.textContent = message;
        target.hidden = false;
        target.classList.add('is-visible');
        toastTimer = window.setTimeout(() => {
            target.classList.remove('is-visible');
            target.hidden = true;
        }, 3500);
    };
    const productCount = count => `${count} ${count === 1 ? 'устройство' : count > 1 && count < 5 ? 'устройства' : 'устройств'}`;
    const normalize = text => text.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
    const syncUrl = () => {
        try {
            const url = new URL(location.href);
            if (state.category === 'all') url.searchParams.delete('category');
            else url.searchParams.set('category', state.category);
            if (state.search) url.searchParams.set('q', state.search);
            else url.searchParams.delete('q');
            if (state.favoritesOnly) url.searchParams.set('favorites', '1');
            else url.searchParams.delete('favorites');
            history.replaceState(null, '', url);
        } catch { /* file:// navigation can restrict history changes. */ }
    };

    const renderCard = product => {
        const favorite = favorites.has(product.id);
        const compare = compared.has(product.id);
        return `<article class="product-card" data-product="${product.id}">
            <div class="product-visual product-visual--${product.category}">
                <a href="${product.url}" aria-label="${product.title}"><img src="${product.image}" alt="${product.alt}" width="800" height="800" loading="lazy" decoding="async"></a>
                <button class="icon-button favorite-button" type="button" data-favorite="${product.id}" aria-pressed="${favorite}" aria-label="${favorite ? 'Убрать' : 'Добавить'} ${product.name} ${favorite ? 'из избранного' : 'в избранное'}" title="${favorite ? 'Убрать из избранного' : 'В избранное'}">${heartIcon}</button>
                <span class="product-index">0${products.indexOf(product) + 1} / ${product.categoryName}</span>
            </div>
            <div class="product-meta">
                <span class="eyebrow">${product.categoryName}</span>
                <a class="product-title" href="${product.url}"><h3>${product.name}</h3><span aria-hidden="true">↗</span></a>
                <p>${product.description}</p>
                <div class="product-bottom"><span>${product.summary}</span><button class="text-button compare-button" type="button" data-compare="${product.id}" aria-pressed="${compare}" aria-label="${compare ? 'Убрать' : 'Добавить'} ${product.name} ${compare ? 'из сравнения' : 'к сравнению'}">${compare ? 'В сравнении ✓' : 'Сравнить +'}</button></div>
            </div>
        </article>`;
    };

    const filteredProducts = () => products.filter(product => {
        const content = normalize(`${product.name} ${product.title} ${product.description} ${product.categoryName} ${product.connection} ${product.type}`);
        return (state.category === 'all' || product.category === state.category)
            && (!state.favoritesOnly || favorites.has(product.id))
            && (!state.search || content.includes(normalize(state.search)));
    }).sort((a, b) => state.sort === 'name' ? a.name.localeCompare(b.name, 'ru') : products.indexOf(a) - products.indexOf(b));

    const syncButtons = () => {
        document.querySelectorAll('[data-favorite]').forEach(button => {
            const product = byId.get(button.dataset.favorite);
            if (!product) return;
            const selected = favorites.has(product.id);
            button.setAttribute('aria-pressed', String(selected));
            button.classList.toggle('is-active', selected);
            button.setAttribute('aria-label', `${selected ? 'Убрать' : 'Добавить'} ${product.name} ${selected ? 'из избранного' : 'в избранное'}`);
            button.title = selected ? 'Убрать из избранного' : 'В избранное';
            const label = button.querySelector('[data-favorite-label]');
            if (label) label.textContent = selected ? 'В избранном' : 'В избранное';
        });
        document.querySelectorAll('[data-compare]').forEach(button => {
            const selected = compared.has(button.dataset.compare);
            const product = byId.get(button.dataset.compare);
            button.setAttribute('aria-pressed', String(selected));
            button.classList.toggle('is-active', selected);
            if (product) button.setAttribute('aria-label', `${selected ? 'Убрать' : 'Добавить'} ${product.name} ${selected ? 'из сравнения' : 'к сравнению'}`);
            const label = button.querySelector('[data-compare-label]');
            if (label) label.textContent = selected ? 'В сравнении ✓' : 'Сравнить +';
            else if (button.classList.contains('compare-button')) button.textContent = selected ? 'В сравнении ✓' : 'Сравнить +';
        });
        document.querySelectorAll('[data-favorite-count]').forEach(target => { target.textContent = String(favorites.size); });
        document.querySelectorAll('[data-compare-count]').forEach(target => { target.textContent = String(compared.size); });
        document.querySelectorAll('[data-compare-bar]').forEach(target => { target.hidden = compared.size === 0; });
        document.body.classList.toggle('has-comparison', compared.size > 0);
    };

    const renderComparison = () => {
        if (!compareContent) return;
        const selected = products.filter(product => compared.has(product.id));
        if (!selected.length) {
            compareContent.innerHTML = '<p class="empty-message">Добавьте устройства из каталога, чтобы сравнить их характеристики.</p><a class="button button--dark" href="catalog.html">Перейти в каталог ↗</a>';
            return;
        }
        const rows = [
            ['Устройство', product => product.type],
            ['Подключение', product => product.connection],
            ['Особенности', product => product.features],
            ['Питание', product => product.power],
            ['Назначение', product => product.purpose]
        ];
        compareContent.innerHTML = `<div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Характеристики выбранных устройств"><table class="comparison-table"><caption class="sr-only">Сравнение выбранных устройств</caption><thead><tr><th scope="col">Характеристики</th>${selected.map(product => `<th scope="col"><a href="${product.url}">${product.name} ↗</a><button class="compare-remove" type="button" data-remove-compare="${product.id}" aria-label="Убрать ${product.name} из сравнения">Убрать ×</button></th>`).join('')}</tr></thead><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${label}</th>${selected.map(product => `<td>${value(product)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="comparison-note">Сравнивайте устройства одного типа по характеристикам, а разные категории — по подключению и задачам.</p>`;
    };

    const render = () => {
        const results = filteredProducts();
        grids.forEach(grid => {
            const limit = Number(grid.dataset.limit) || results.length;
            grid.innerHTML = results.slice(0, limit).map(renderCard).join('');
        });
        document.querySelectorAll('[data-result-count]').forEach(target => {
            target.textContent = `${productCount(results.length)}${state.favoritesOnly ? ' в избранном' : ' в коллекции'}`;
        });
        document.querySelectorAll('[data-empty-state]').forEach(target => { target.hidden = results.length > 0; });
        filterButtons.forEach(button => {
            const selected = button.dataset.filter === state.category;
            button.setAttribute('aria-pressed', String(selected));
            button.classList.toggle('is-active', selected);
        });
        document.querySelectorAll('[data-favorites-filter]').forEach(button => {
            button.setAttribute('aria-pressed', String(state.favoritesOnly));
            button.classList.toggle('is-active', state.favoritesOnly);
        });
        syncButtons();
        renderComparison();
    };

    const resetFilters = () => {
        state.category = 'all'; state.search = ''; state.favoritesOnly = false; state.sort = 'default';
        searchInputs.forEach(input => { input.value = ''; });
        document.querySelectorAll('[data-sort]').forEach(select => { select.value = 'default'; });
        syncUrl(); render();
        searchInputs[0]?.focus();
    };

    const setMenu = open => {
        document.querySelectorAll('[data-menu-toggle]').forEach(button => {
            button.setAttribute('aria-expanded', String(open));
            button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
        });
        document.querySelectorAll('[data-mobile-nav]').forEach(nav => { nav.classList.toggle('is-open', open); });
        document.body.classList.toggle('menu-open', open);
    };

    const toggleSelection = (collection, id, key, label) => {
        if (!byId.has(id)) return;
        const wasSelected = collection.has(id);
        if (wasSelected) collection.delete(id); else collection.add(id);
        writeIds(key, collection);
        render();
        toast(`${byId.get(id).name} ${wasSelected ? 'убрано из' : 'добавлено в'} ${label}`);
    };

    document.addEventListener('click', event => {
        const element = event.target instanceof Element ? event.target : null;
        if (!element) return;
        const favorite = element.closest('[data-favorite]');
        if (favorite) {
            event.preventDefault();
            const id = favorite.dataset.favorite;
            const wasInGrid = Boolean(favorite.closest('[data-product-grid]'));
            toggleSelection(favorites, id, storageKeys.favorites, 'избранное');
            if (wasInGrid) {
                const replacement = document.querySelector(`[data-product-grid] [data-favorite="${id}"]`);
                (replacement || document.querySelector('[data-favorites-filter]') || searchInputs[0])?.focus({ preventScroll: true });
            }
            return;
        }
        const compare = element.closest('[data-compare]');
        if (compare) {
            event.preventDefault();
            const id = compare.dataset.compare;
            const wasInGrid = Boolean(compare.closest('[data-product-grid]'));
            toggleSelection(compared, id, storageKeys.compare, 'сравнение');
            if (wasInGrid) document.querySelector(`[data-product-grid] [data-compare="${id}"]`)?.focus({ preventScroll: true });
            return;
        }
        const remove = element.closest('[data-remove-compare]');
        if (remove) {
            compared.delete(remove.dataset.removeCompare);
            writeIds(storageKeys.compare, compared);
            render();
            if (compareDialog?.open) (compareContent?.querySelector('button, a') || compareDialog.querySelector('[data-close-dialog]'))?.focus();
            return;
        }
        const filter = element.closest('[data-filter]');
        if (filter && (filter.dataset.filter === 'all' || byId.has(filter.dataset.filter))) {
            state.category = filter.dataset.filter; syncUrl(); render(); return;
        }
        if (element.closest('[data-favorites-filter]')) {
            state.favoritesOnly = !state.favoritesOnly; syncUrl(); render(); return;
        }
        if (element.closest('[data-reset-filters]')) { resetFilters(); return; }
        if (element.closest('[data-menu-toggle]')) { setMenu(!document.body.classList.contains('menu-open')); return; }
        if (element.closest('[data-mobile-nav] a')) setMenu(false);
        if (document.body.classList.contains('menu-open') && !element.closest('[data-mobile-nav], [data-menu-toggle]')) setMenu(false);
        if (element.closest('[data-open-compare]') && compareDialog) {
            renderComparison();
            if (typeof compareDialog.showModal === 'function') { if (!compareDialog.open) compareDialog.showModal(); }
            else compareDialog.setAttribute('open', '');
        }
        if (element.closest('[data-close-dialog]') && compareDialog) {
            if (typeof compareDialog.close === 'function') compareDialog.close();
            else compareDialog.removeAttribute('open');
        }
        if (element.closest('[data-clear-compare]')) {
            compared.clear(); writeIds(storageKeys.compare, compared); render(); toast('Сравнение очищено');
        }
        if (element.closest('[data-back-top]')) window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    });

    compareDialog?.addEventListener('click', event => {
        if (event.target !== compareDialog) return;
        const bounds = compareDialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) compareDialog.close();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
            setMenu(false); document.querySelector('[data-menu-toggle]')?.focus();
        }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
    searchInputs.forEach(input => input.addEventListener('input', () => {
        state.search = input.value.trim();
        searchInputs.filter(other => other !== input).forEach(other => { other.value = input.value; });
        syncUrl(); render();
    }));
    document.querySelectorAll('[data-sort]').forEach(select => select.addEventListener('change', () => { state.sort = select.value; render(); }));

    document.querySelectorAll('[data-finder]').forEach(form => form.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(form);
        const task = data.get('task') || 'everyday';
        const connection = data.get('connection') || 'any';
        const result = document.querySelector('[data-finder-result]');
        if (!result) return;
        const relevant = products.filter(product => connection === 'any' || (connection === 'wireless' ? product.wireless : !product.wireless));
        const lead = task === 'work' ? 'Начните с удобного ввода и связи.' : task === 'play' ? 'Сначала проверьте управление и совместимость.' : 'Соберите основу для ваших повседневных задач.';
        const guidance = task === 'work'
            ? 'Для таблиц пригодится цифровой блок Type K1, для разговоров — микрофон Sound H1. Размер и удобство лучше оценить лично.'
            : task === 'play'
                ? 'В каталоге представлены базовые устройства. Перед выбором для игр проверьте требования к задержке, форме и дополнительным кнопкам: заявлений об игровых характеристиках здесь нет.'
                : 'Выберите мышь по удобству хвата, клавиатуру — по формату, наушники — по посадке и подключению.';
        const limitation = connection === 'wireless' ? '<p class="finder-note">Среди текущих моделей беспроводное подключение есть только у Click M1. Клавиатура Type K1 и наушники Sound H1 подключаются проводом.</p>' : '';
        result.innerHTML = `<span class="eyebrow">Ваш ориентир</span><h3>${escapeHTML(lead)}</h3><p>${escapeHTML(guidance)}</p>${limitation}<div class="finder-links">${relevant.map(product => `<a class="button button--outline" href="${product.url}">${product.name} ↗</a>`).join('')}</div><p class="finder-note">Для USB-приёмника нужен совместимый свободный порт. Для гарнитуры проверьте поддержку микрофона у разъёма компьютера.</p>`;
        result.hidden = false;
        result.setAttribute('tabindex', '-1');
        result.focus({ preventScroll: true });
        result.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
    }));

    window.addEventListener('storage', event => {
        if (event.key === storageKeys.favorites || event.key === storageKeys.compare || event.key === null) {
            favorites = readIds(storageKeys.favorites); compared = readIds(storageKeys.compare); render();
        }
    });
    window.addEventListener('popstate', () => {
        const params = new URLSearchParams(location.search);
        state.category = byId.has(params.get('category')) ? params.get('category') : 'all';
        state.search = params.get('q') || '';
        state.favoritesOnly = params.get('favorites') === '1';
        searchInputs.forEach(input => { input.value = state.search; });
        render();
    });

    const initialParams = new URLSearchParams(location.search);
    if (byId.has(initialParams.get('category'))) state.category = initialParams.get('category');
    state.search = initialParams.get('q') || '';
    state.favoritesOnly = initialParams.get('favorites') === '1';
    searchInputs.forEach(input => { input.value = state.search; });
    window.Periphery = { products: Object.freeze(products.map(product => Object.freeze({ ...product }))) };
    render();

    if ('IntersectionObserver' in window && !reducedMotion.matches) {
        const revealTargets = document.querySelectorAll('[data-reveal]');
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
        revealTargets.forEach(target => {
            target.classList.add('reveal-ready');
            observer.observe(target);
        });
        window.addEventListener('pagehide', () => revealTargets.forEach(target => target.classList.add('is-revealed')), { once: true });
    }
})();
