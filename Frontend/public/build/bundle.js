
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe$1(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe$1(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const { set, subscribe } = writable({});

    const remove = () => {
      set({});
    };

    const activeRoute = {
      subscribe,
      set,
      remove,
    };

    const UrlParser = (urlString, namedUrl = '') => {
      const urlBase = new URL(urlString);

      /**
       * Wrapper for URL.hash
       *
       **/
      function hash() {
        return urlBase.hash;
      }

      /**
       * Wrapper for URL.host
       *
       **/
      function host() {
        return urlBase.host;
      }

      /**
       * Wrapper for URL.hostname
       *
       **/
      function hostname() {
        return urlBase.hostname;
      }

      /**
       * Returns an object with all the named params and their values
       *
       **/
      function namedParams() {
        const allPathName = pathNames();
        const allNamedParamsKeys = namedParamsWithIndex();

        return allNamedParamsKeys.reduce((values, paramKey) => {
          values[paramKey.value] = allPathName[paramKey.index];
          return values;
        }, {});
      }

      /**
       * Returns an array with all the named param keys
       *
       **/
      function namedParamsKeys() {
        const allNamedParamsKeys = namedParamsWithIndex();

        return allNamedParamsKeys.reduce((values, paramKey) => {
          values.push(paramKey.value);
          return values;
        }, []);
      }

      /**
       * Returns an array with all the named param values
       *
       **/
      function namedParamsValues() {
        const allPathName = pathNames();
        const allNamedParamsKeys = namedParamsWithIndex();

        return allNamedParamsKeys.reduce((values, paramKey) => {
          values.push(allPathName[paramKey.index]);
          return values;
        }, []);
      }

      /**
       * Returns an array with all named param ids and their position in the path
       * Private
       **/
      function namedParamsWithIndex() {
        const namedUrlParams = getPathNames(namedUrl);

        return namedUrlParams.reduce((validParams, param, index) => {
          if (param[0] === ':') {
            validParams.push({ value: param.slice(1), index });
          }
          return validParams;
        }, []);
      }

      /**
       * Wrapper for URL.port
       *
       **/
      function port() {
        return urlBase.port;
      }

      /**
       * Wrapper for URL.pathname
       *
       **/
      function pathname() {
        return urlBase.pathname;
      }

      /**
       * Wrapper for URL.protocol
       *
       **/
      function protocol() {
        return urlBase.protocol;
      }

      /**
       * Wrapper for URL.search
       *
       **/
      function search() {
        return urlBase.search;
      }

      /**
       * Returns an object with all query params and their values
       *
       **/
      function queryParams() {
        const params = {};
        urlBase.searchParams.forEach((value, key) => {
          params[key] = value;
        });

        return params;
      }

      /**
       * Returns an array with all the query param keys
       *
       **/
      function queryParamsKeys() {
        const params = [];
        urlBase.searchParams.forEach((_value, key) => {
          params.push(key);
        });

        return params;
      }

      /**
       * Returns an array with all the query param values
       *
       **/
      function queryParamsValues() {
        const params = [];
        urlBase.searchParams.forEach((value) => {
          params.push(value);
        });

        return params;
      }

      /**
       * Returns an array with all the elements of a pathname
       *
       **/
      function pathNames() {
        return getPathNames(urlBase.pathname);
      }

      /**
       * Returns an array with all the parts of a pathname
       * Private method
       **/
      function getPathNames(pathName) {
        if (pathName === '/' || pathName.trim().length === 0) return [pathName];
        if (pathName.slice(-1) === '/') {
          pathName = pathName.slice(0, -1);
        }
        if (pathName[0] === '/') {
          pathName = pathName.slice(1);
        }

        return pathName.split('/');
      }

      return Object.freeze({
        hash: hash(),
        host: host(),
        hostname: hostname(),
        namedParams: namedParams(),
        namedParamsKeys: namedParamsKeys(),
        namedParamsValues: namedParamsValues(),
        pathNames: pathNames(),
        port: port(),
        pathname: pathname(),
        protocol: protocol(),
        search: search(),
        queryParams: queryParams(),
        queryParamsKeys: queryParamsKeys(),
        queryParamsValues: queryParamsValues(),
      });
    };

    /**
     * Returns true if object has any nested routes empty
     * @param routeObject
     **/
    const anyEmptyNestedRoutes = (routeObject) => {
      let result = false;
      if (Object.keys(routeObject).length === 0) {
        return true;
      }

      if (routeObject.childRoute && Object.keys(routeObject.childRoute).length === 0) {
        result = true;
      } else if (routeObject.childRoute) {
        result = anyEmptyNestedRoutes(routeObject.childRoute);
      }

      return result;
    };

    /**
     * Compare two routes ignoring named params
     * @param pathName string
     * @param routeName string
     **/

    const compareRoutes = (pathName, routeName) => {
      routeName = removeSlash(routeName);

      if (routeName.includes(':')) {
        return routeName.includes(pathName);
      } else {
        return routeName.startsWith(pathName);
      }
    };

    /**
     * Returns a boolean indicating if the name of path exists in the route based on the language parameter
     * @param pathName string
     * @param route object
     * @param language string
     **/

    const findLocalisedRoute = (pathName, route, language) => {
      let exists = false;

      if (language) {
        return { exists: route.lang && route.lang[language] && route.lang[language].includes(pathName), language };
      }

      exists = compareRoutes(pathName, route.name);

      if (!exists && route.lang && typeof route.lang === 'object') {
        for (const [key, value] of Object.entries(route.lang)) {
          if (compareRoutes(pathName, value)) {
            exists = true;
            language = key;
          }
        }
      }

      return { exists, language };
    };

    /**
     * Return all the consecutive named param (placeholders) of a pathname
     * @param pathname
     **/
    const getNamedParams = (pathName = '') => {
      if (pathName.trim().length === 0) return [];
      const namedUrlParams = getPathNames(pathName);
      return namedUrlParams.reduce((validParams, param) => {
        if (param[0] === ':') {
          validParams.push(param.slice(1));
        }

        return validParams;
      }, []);
    };

    /**
     * Split a pathname based on /
     * @param pathName
     * Private method
     **/
    const getPathNames = (pathName) => {
      if (pathName === '/' || pathName.trim().length === 0) return [pathName];

      pathName = removeSlash(pathName, 'both');

      return pathName.split('/');
    };

    /**
     * Return the first part of a pathname until the first named param is found
     * @param name
     **/
    const nameToPath = (name = '') => {
      let routeName;
      if (name === '/' || name.trim().length === 0) return name;
      name = removeSlash(name, 'lead');
      routeName = name.split(':')[0];
      routeName = removeSlash(routeName, 'trail');

      return routeName.toLowerCase();
    };

    /**
     * Return the path name excluding query params
     * @param name
     **/
    const pathWithoutQueryParams = (currentRoute) => {
      const path = currentRoute.path.split('?');
      return path[0];
    };

    /**
     * Return the path name including query params
     * @param name
     **/
    const pathWithQueryParams = (currentRoute) => {
      let queryParams = [];
      if (currentRoute.queryParams) {
        for (let [key, value] of Object.entries(currentRoute.queryParams)) {
          queryParams.push(`${key}=${value}`);
        }
      }

      const hash = currentRoute.hash ? currentRoute.hash : '';

      if (queryParams.length > 0) {
        return `${currentRoute.path}?${queryParams.join('&')}${hash}`;
      } else {
        return currentRoute.path + hash;
      }
    };

    /**
     * Returns a string with trailing or leading slash character removed
     * @param pathName string
     * @param position string - lead, trail, both
     **/
    const removeExtraPaths = (pathNames, basePathNames) => {
      const names = basePathNames.split('/');
      if (names.length > 1) {
        names.forEach(function (name, index) {
          if (name.length > 0 && index > 0) {
            pathNames.shift();
          }
        });
      }

      return pathNames;
    };

    /**
     * Returns a string with trailing or leading slash character removed
     * @param pathName string
     * @param position string - lead, trail, both
     **/

    const removeSlash = (pathName, position = 'lead') => {
      if (position === 'trail' || position === 'both') {
        pathName = pathName.replace(/\/$/, '');
      }

      if (position === 'lead' || position === 'both') {
        pathName = pathName.replace(/^\//, '');
      }

      return pathName;
    };

    /**
     * Returns the name of the route based on the language parameter
     * @param route object
     * @param language string
     **/

    const routeNameLocalised = (route, language = null) => {
      if (!language || !route.lang || !route.lang[language]) {
        return route.name;
      } else {
        return route.lang[language];
      }
    };

    /**
     * Return the path name excluding query params
     * @param name
     **/
    const startsWithNamedParam = (currentRoute) => {
      const routeName = removeSlash(currentRoute);

      return routeName.startsWith(':');
    };

    /**
     * Updates the base route path.
     * Route objects can have nested routes (childRoutes) or just a long name like "admin/employees/show/:id"
     *
     * @param basePath string
     * @param pathNames array
     * @param route object
     * @param language string
     **/

    const updateRoutePath = (basePath, pathNames, route, language, convert = false) => {
      if (basePath === '/' || basePath.trim().length === 0) return { result: basePath, language: null };

      let basePathResult = basePath;
      let routeName = route.name;
      let currentLanguage = language;

      if (convert) {
        currentLanguage = '';
      }

      routeName = removeSlash(routeName);
      basePathResult = removeSlash(basePathResult);

      if (!route.childRoute) {
        let localisedRoute = findLocalisedRoute(basePathResult, route, currentLanguage);

        if (localisedRoute.exists && convert) {
          basePathResult = routeNameLocalised(route, language);
        }

        let routeNames = routeName.split(':')[0];
        routeNames = removeSlash(routeNames, 'trail');
        routeNames = routeNames.split('/');
        routeNames.shift();
        routeNames.forEach(() => {
          const currentPathName = pathNames[0];
          localisedRoute = findLocalisedRoute(`${basePathResult}/${currentPathName}`, route, currentLanguage);

          if (currentPathName && localisedRoute.exists) {
            if (convert) {
              basePathResult = routeNameLocalised(route, language);
            } else {
              basePathResult = `${basePathResult}/${currentPathName}`;
            }
            pathNames.shift();
          } else {
            return { result: basePathResult, language: localisedRoute.language };
          }
        });
        return { result: basePathResult, language: localisedRoute.language };
      } else {
        return { result: basePath, language: currentLanguage };
      }
    };

    const RouterCurrent = (trackPage) => {
      const trackPageview = trackPage || false;
      let activeRoute = '';

      const setActive = (newRoute, updateBrowserHistory) => {
        activeRoute = newRoute.path;
        pushActiveRoute(newRoute, updateBrowserHistory);
      };

      const active = () => {
        return activeRoute;
      };

      /**
       * Returns true if pathName is current active route
       * @param pathName String The path name to check against the current route.
       * @param includePath Boolean if true checks that pathName is included in current route. If false should match it.
       **/
      const isActive = (queryPath, includePath = false) => {
        if (queryPath[0] !== '/') {
          queryPath = '/' + queryPath;
        }

        // remove query params for comparison
        let pathName = UrlParser(`http://fake.com${queryPath}`).pathname;
        let activeRoutePath = UrlParser(`http://fake.com${activeRoute}`).pathname;

        pathName = removeSlash(pathName, 'trail');

        activeRoutePath = removeSlash(activeRoutePath, 'trail');

        if (includePath) {
          return activeRoutePath.includes(pathName);
        } else {
          return activeRoutePath === pathName;
        }
      };

      const pushActiveRoute = (newRoute, updateBrowserHistory) => {
        if (typeof window !== 'undefined') {
          const pathAndSearch = pathWithQueryParams(newRoute);

          if (updateBrowserHistory) {
            window.history.pushState({ page: pathAndSearch }, '', pathAndSearch);
          }
          // Moving back in history does not update browser history but does update tracking.
          if (trackPageview) {
            gaTracking(pathAndSearch);
          }
        }
      };

      const gaTracking = (newPage) => {
        if (typeof ga !== 'undefined') {
          ga('set', 'page', newPage);
          ga('send', 'pageview');
        }
      };

      return Object.freeze({ active, isActive, setActive });
    };

    const RouterGuard = (onlyIf) => {
      const guardInfo = onlyIf;

      const valid = () => {
        return guardInfo && guardInfo.guard && typeof guardInfo.guard === 'function';
      };

      const redirect = () => {
        return !guardInfo.guard();
      };

      const redirectPath = () => {
        let destinationUrl = '/';
        if (guardInfo.redirect && guardInfo.redirect.length > 0) {
          destinationUrl = guardInfo.redirect;
        }

        return destinationUrl;
      };

      return Object.freeze({ valid, redirect, redirectPath });
    };

    const RouterRedirect = (route, currentPath) => {
      const guard = RouterGuard(route.onlyIf);

      const path = () => {
        let redirectTo = currentPath;
        if (route.redirectTo && route.redirectTo.length > 0) {
          redirectTo = route.redirectTo;
        }

        if (guard.valid() && guard.redirect()) {
          redirectTo = guard.redirectPath();
        }

        return redirectTo;
      };

      return Object.freeze({ path });
    };

    function RouterRoute({ routeInfo, path, routeNamedParams, urlParser, namedPath, language }) {
      const namedParams = () => {
        const parsedParams = UrlParser(`https://fake.com${urlParser.pathname}`, namedPath).namedParams;

        return { ...routeNamedParams, ...parsedParams };
      };

      const get = () => {
        return {
          name: path,
          component: routeInfo.component,
          hash: urlParser.hash,
          layout: routeInfo.layout,
          queryParams: urlParser.queryParams,
          namedParams: namedParams(),
          path,
          language,
        };
      };

      return Object.freeze({ get, namedParams });
    }

    function RouterPath({ basePath, basePathName, pathNames, convert, currentLanguage }) {
      let updatedPathRoute;
      let route;
      let routePathLanguage = currentLanguage;

      function updatedPath(currentRoute) {
        route = currentRoute;
        updatedPathRoute = updateRoutePath(basePathName, pathNames, route, routePathLanguage, convert);
        routePathLanguage = convert ? currentLanguage : updatedPathRoute.language;

        return updatedPathRoute;
      }

      function localisedPathName() {
        return routeNameLocalised(route, routePathLanguage);
      }

      function localisedRouteWithoutNamedParams() {
        return nameToPath(localisedPathName());
      }

      function basePathNameWithoutNamedParams() {
        return nameToPath(updatedPathRoute.result);
      }

      function namedPath() {
        const localisedPath = localisedPathName();

        return basePath ? `${basePath}/${localisedPath}` : localisedPath;
      }

      function routePath() {
        let routePathValue = `${basePath}/${basePathNameWithoutNamedParams()}`;
        if (routePathValue === '//') {
          routePathValue = '/';
        }

        if (routePathLanguage) {
          pathNames = removeExtraPaths(pathNames, localisedRouteWithoutNamedParams());
        }

        const namedParams = getNamedParams(localisedPathName());
        if (namedParams && namedParams.length > 0) {
          namedParams.forEach(function () {
            if (pathNames.length > 0) {
              routePathValue += `/${pathNames.shift()}`;
            }
          });
        }

        return routePathValue;
      }

      function routeLanguage() {
        return routePathLanguage;
      }

      function basePathSameAsLocalised() {
        return basePathNameWithoutNamedParams() === localisedRouteWithoutNamedParams();
      }

      return Object.freeze({
        basePathSameAsLocalised,
        updatedPath,
        basePathNameWithoutNamedParams,
        localisedPathName,
        localisedRouteWithoutNamedParams,
        namedPath,
        pathNames,
        routeLanguage,
        routePath,
      });
    }

    const NotFoundPage$1 = '/404.html';

    function RouterFinder({ routes, currentUrl, routerOptions, convert }) {
      const defaultLanguage = routerOptions.defaultLanguage;
      const sitePrefix = routerOptions.prefix ? routerOptions.prefix.toLowerCase() : '';
      const urlParser = parseCurrentUrl(currentUrl, sitePrefix);
      let redirectTo = '';
      let routeNamedParams = {};
      let staticParamMatch = false;

      function findActiveRoute() {
        let searchActiveRoute = searchActiveRoutes(routes, '', urlParser.pathNames, routerOptions.lang, convert);

        if (!searchActiveRoute || !Object.keys(searchActiveRoute).length || anyEmptyNestedRoutes(searchActiveRoute)) {
          if (typeof window !== 'undefined') {
            searchActiveRoute = routeNotFound(routerOptions.lang);
          }
        } else {
          searchActiveRoute.path = pathWithoutQueryParams(searchActiveRoute);
          if (sitePrefix) {
            searchActiveRoute.path = `/${sitePrefix}${searchActiveRoute.path}`;
          }
        }

        return searchActiveRoute;
      }

      /**
       * Gets an array of routes and the browser pathname and return the active route
       * @param routes
       * @param basePath
       * @param pathNames
       **/
      function searchActiveRoutes(routes, basePath, pathNames, currentLanguage, convert) {
        let currentRoute = {};
        let basePathName = pathNames.shift().toLowerCase();
        const routerPath = RouterPath({ basePath, basePathName, pathNames, convert, currentLanguage });
        staticParamMatch = false;

        routes.forEach(function (route) {
          routerPath.updatedPath(route);
          if (route.name !== '/') {
            route.name = removeSlash(route.name);
          }
          if (matchRoute(routerPath, route.name)) {
            let routePath = routerPath.routePath();
            redirectTo = RouterRedirect(route, redirectTo).path();

            if (currentRoute.name !== routePath) {
              currentRoute = setCurrentRoute({
                route,
                routePath,
                routeLanguage: routerPath.routeLanguage(),
                urlParser,
                namedPath: routerPath.namedPath(),
              });
            }

            if (route.nestedRoutes && route.nestedRoutes.length > 0 && routerPath.pathNames.length > 0) {
              currentRoute.childRoute = searchActiveRoutes(
                route.nestedRoutes,
                routePath,
                routerPath.pathNames,
                routerPath.routeLanguage(),
                convert
              );
              currentRoute.path = currentRoute.childRoute.path;
              currentRoute.language = currentRoute.childRoute.language;
            } else if (nestedRoutesAndNoPath(route, routerPath.pathNames)) {
              const indexRoute = searchActiveRoutes(
                route.nestedRoutes,
                routePath,
                ['index'],
                routerPath.routeLanguage(),
                convert
              );
              if (indexRoute && Object.keys(indexRoute).length > 0) {
                currentRoute.childRoute = indexRoute;
                currentRoute.language = currentRoute.childRoute.language;
              }
            }
          }
        });

        if (redirectTo) {
          currentRoute.redirectTo = redirectTo;
        }

        return currentRoute;
      }

      function matchRoute(routerPath, routeName) {
        const basePathSameAsLocalised = routerPath.basePathSameAsLocalised();
        if (basePathSameAsLocalised) {
          staticParamMatch = true;
        }

        return basePathSameAsLocalised || (!staticParamMatch && startsWithNamedParam(routeName));
      }

      function nestedRoutesAndNoPath(route, pathNames) {
        return route.nestedRoutes && route.nestedRoutes.length > 0 && pathNames.length === 0;
      }

      function parseCurrentUrl(currentUrl, sitePrefix) {
        if (sitePrefix && sitePrefix.trim().length > 0) {
          const noPrefixUrl = currentUrl.replace(sitePrefix + '/', '');
          return UrlParser(noPrefixUrl);
        } else {
          return UrlParser(currentUrl);
        }
      }

      function setCurrentRoute({ route, routePath, routeLanguage, urlParser, namedPath }) {
        const routerRoute = RouterRoute({
          routeInfo: route,
          urlParser,
          path: routePath,
          routeNamedParams,
          namedPath,
          language: routeLanguage || defaultLanguage,
        });
        routeNamedParams = routerRoute.namedParams();

        return routerRoute.get();
      }

      const routeNotFound = (customLanguage) => {
        const custom404Page = routes.find((route) => route.name == '404');
        const language = customLanguage || defaultLanguage || '';
        if (custom404Page) {
          return { ...custom404Page, language, path: '404' };
        } else {
          return { name: '404', component: '', path: '404', redirectTo: NotFoundPage$1 };
        }
      };

      return Object.freeze({ findActiveRoute });
    }

    const NotFoundPage = '/404.html';

    let userDefinedRoutes = [];
    let routerOptions = {};
    let routerCurrent;

    /**
     * Object exposes one single property: activeRoute
     * @param routes  Array of routes
     * @param currentUrl current url
     * @param options configuration options
     **/
    const SpaRouter = (routes, currentUrl, options = {}) => {
      routerOptions = { ...options };
      if (typeof currentUrl === 'undefined' || currentUrl === '') {
        currentUrl = document.location.href;
      }

      routerCurrent = RouterCurrent(routerOptions.gaPageviews);

      currentUrl = removeSlash(currentUrl, 'trail');
      userDefinedRoutes = routes;

      const findActiveRoute = () => {
        let convert = false;

        if (routerOptions.langConvertTo) {
          routerOptions.lang = routerOptions.langConvertTo;
          convert = true;
        }

        return RouterFinder({ routes, currentUrl, routerOptions, convert }).findActiveRoute();
      };

      /**
       * Redirect current route to another
       * @param destinationUrl
       **/
      const navigateNow = (destinationUrl, updateBrowserHistory) => {
        if (typeof window !== 'undefined') {
          if (destinationUrl === NotFoundPage) {
            routerCurrent.setActive({ path: NotFoundPage }, updateBrowserHistory);
          } else {
            navigateTo(destinationUrl);
          }
        }

        return destinationUrl;
      };

      const setActiveRoute = (updateBrowserHistory = true) => {
        const currentRoute = findActiveRoute();
        if (currentRoute.redirectTo) {
          return navigateNow(currentRoute.redirectTo, updateBrowserHistory);
        }

        routerCurrent.setActive(currentRoute, updateBrowserHistory);
        activeRoute.set(currentRoute);

        return currentRoute;
      };

      return Object.freeze({
        setActiveRoute,
        findActiveRoute,
      });
    };

    /**
     * Updates the current active route and updates the browser pathname
     * @param pathName String
     * @param language String
     * @param updateBrowserHistory Boolean
     **/
    const navigateTo = (pathName, language = null, updateBrowserHistory = true) => {
      pathName = removeSlash(pathName, 'lead');

      if (language) {
        routerOptions.langConvertTo = language;
      }

      return SpaRouter(userDefinedRoutes, 'http://fake.com/' + pathName, routerOptions).setActiveRoute(
        updateBrowserHistory
      );
    };

    if (typeof window !== 'undefined') {
      // Avoid full page reload on local routes
      window.addEventListener('click', (event) => {
        if (event.target.localName.toLowerCase() !== 'a') return;
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;

        const sitePrefix = routerOptions.prefix ? `/${routerOptions.prefix.toLowerCase()}` : '';
        const targetHostNameInternal = event.target.pathname && event.target.host === window.location.host;
        const prefixMatchPath = sitePrefix.length > 1 ? event.target.pathname.startsWith(sitePrefix) : true;

        if (targetHostNameInternal && prefixMatchPath) {
          event.preventDefault();
          let navigatePathname = event.target.pathname + event.target.search;

          const destinationUrl = navigatePathname + event.target.search + event.target.hash;
          if (event.target.target === '_blank') {
            window.open(destinationUrl, 'newTab');
          } else {
            navigateTo(destinationUrl);
          }
        }
      });

      window.onpopstate = function (_event) {
        let navigatePathname = window.location.pathname + window.location.search + window.location.hash;

        navigateTo(navigatePathname, null, false);
      };
    }

    /* node_modules/svelte-router-spa/src/components/route.svelte generated by Svelte v3.38.2 */

    // (10:34) 
    function create_if_block_2(ctx) {
    	let route;
    	let current;

    	route = new Route({
    			props: {
    				currentRoute: /*currentRoute*/ ctx[0].childRoute,
    				params: /*params*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_changes = {};
    			if (dirty & /*currentRoute*/ 1) route_changes.currentRoute = /*currentRoute*/ ctx[0].childRoute;
    			if (dirty & /*params*/ 2) route_changes.params = /*params*/ ctx[1];
    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(10:34) ",
    		ctx
    	});

    	return block;
    }

    // (8:33) 
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*currentRoute*/ ctx[0].component;

    	function switch_props(ctx) {
    		return {
    			props: {
    				currentRoute: {
    					.../*currentRoute*/ ctx[0],
    					component: ""
    				},
    				params: /*params*/ ctx[1]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};

    			if (dirty & /*currentRoute*/ 1) switch_instance_changes.currentRoute = {
    				.../*currentRoute*/ ctx[0],
    				component: ""
    			};

    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*currentRoute*/ ctx[0].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(8:33) ",
    		ctx
    	});

    	return block;
    }

    // (6:0) {#if currentRoute.layout}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*currentRoute*/ ctx[0].layout;

    	function switch_props(ctx) {
    		return {
    			props: {
    				currentRoute: { .../*currentRoute*/ ctx[0], layout: "" },
    				params: /*params*/ ctx[1]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*currentRoute*/ 1) switch_instance_changes.currentRoute = { .../*currentRoute*/ ctx[0], layout: "" };
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*currentRoute*/ ctx[0].layout)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(6:0) {#if currentRoute.layout}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentRoute*/ ctx[0].layout) return 0;
    		if (/*currentRoute*/ ctx[0].component) return 1;
    		if (/*currentRoute*/ ctx[0].childRoute) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, []);
    	let { currentRoute = {} } = $$props;
    	let { params = {} } = $$props;
    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({ currentRoute, params });

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentRoute, params];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { currentRoute: 0, params: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get currentRoute() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-router-spa/src/components/router.svelte generated by Svelte v3.38.2 */

    function create_fragment$2(ctx) {
    	let route;
    	let current;

    	route = new Route({
    			props: { currentRoute: /*$activeRoute*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const route_changes = {};
    			if (dirty & /*$activeRoute*/ 1) route_changes.currentRoute = /*$activeRoute*/ ctx[0];
    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, $$value => $$invalidate(0, $activeRoute = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = [] } = $$props;
    	let { options = {} } = $$props;

    	onMount(() => {
    		SpaRouter(routes, document.location.href, options).setActiveRoute();
    	});

    	const writable_props = ["routes", "options"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(1, routes = $$props.routes);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		SpaRouter,
    		Route,
    		activeRoute,
    		routes,
    		options,
    		$activeRoute
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(1, routes = $$props.routes);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$activeRoute, routes, options];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { routes: 1, options: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get routes() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*!
     * jQuery JavaScript Library v3.6.0
     * https://jquery.com/
     *
     * Includes Sizzle.js
     * https://sizzlejs.com/
     *
     * Copyright OpenJS Foundation and other contributors
     * Released under the MIT license
     * https://jquery.org/license
     *
     * Date: 2021-03-02T17:08Z
     */

    var jquery = createCommonjsModule(function (module) {
    ( function( global, factory ) {

    	{

    		// For CommonJS and CommonJS-like environments where a proper `window`
    		// is present, execute the factory and get jQuery.
    		// For environments that do not have a `window` with a `document`
    		// (such as Node.js), expose a factory as module.exports.
    		// This accentuates the need for the creation of a real `window`.
    		// e.g. var jQuery = require("jquery")(window);
    		// See ticket #14549 for more info.
    		module.exports = global.document ?
    			factory( global, true ) :
    			function( w ) {
    				if ( !w.document ) {
    					throw new Error( "jQuery requires a window with a document" );
    				}
    				return factory( w );
    			};
    	}

    // Pass this if window is not defined yet
    } )( typeof window !== "undefined" ? window : commonjsGlobal, function( window, noGlobal ) {

    var arr = [];

    var getProto = Object.getPrototypeOf;

    var slice = arr.slice;

    var flat = function( array ) {
    	return arr.concat.apply( [], array );
    };


    var push = arr.push;

    var indexOf = arr.indexOf;

    var class2type = {};

    var toString = class2type.toString;

    var hasOwn = class2type.hasOwnProperty;

    var fnToString = hasOwn.toString;

    var ObjectFunctionString = fnToString.call( Object );

    var support = {};

    var isFunction = function isFunction( obj ) {

    		// Support: Chrome <=57, Firefox <=52
    		// In some browsers, typeof returns "function" for HTML <object> elements
    		// (i.e., `typeof document.createElement( "object" ) === "function"`).
    		// We don't want to classify *any* DOM node as a function.
    		// Support: QtWeb <=3.8.5, WebKit <=534.34, wkhtmltopdf tool <=0.12.5
    		// Plus for old WebKit, typeof returns "function" for HTML collections
    		// (e.g., `typeof document.getElementsByTagName("div") === "function"`). (gh-4756)
    		return typeof obj === "function" && typeof obj.nodeType !== "number" &&
    			typeof obj.item !== "function";
    	};


    var isWindow = function isWindow( obj ) {
    		return obj != null && obj === obj.window;
    	};


    var document = window.document;



    	var preservedScriptAttributes = {
    		type: true,
    		src: true,
    		nonce: true,
    		noModule: true
    	};

    	function DOMEval( code, node, doc ) {
    		doc = doc || document;

    		var i, val,
    			script = doc.createElement( "script" );

    		script.text = code;
    		if ( node ) {
    			for ( i in preservedScriptAttributes ) {

    				// Support: Firefox 64+, Edge 18+
    				// Some browsers don't support the "nonce" property on scripts.
    				// On the other hand, just using `getAttribute` is not enough as
    				// the `nonce` attribute is reset to an empty string whenever it
    				// becomes browsing-context connected.
    				// See https://github.com/whatwg/html/issues/2369
    				// See https://html.spec.whatwg.org/#nonce-attributes
    				// The `node.getAttribute` check was added for the sake of
    				// `jQuery.globalEval` so that it can fake a nonce-containing node
    				// via an object.
    				val = node[ i ] || node.getAttribute && node.getAttribute( i );
    				if ( val ) {
    					script.setAttribute( i, val );
    				}
    			}
    		}
    		doc.head.appendChild( script ).parentNode.removeChild( script );
    	}


    function toType( obj ) {
    	if ( obj == null ) {
    		return obj + "";
    	}

    	// Support: Android <=2.3 only (functionish RegExp)
    	return typeof obj === "object" || typeof obj === "function" ?
    		class2type[ toString.call( obj ) ] || "object" :
    		typeof obj;
    }
    /* global Symbol */
    // Defining this global in .eslintrc.json would create a danger of using the global
    // unguarded in another place, it seems safer to define global only for this module



    var
    	version = "3.6.0",

    	// Define a local copy of jQuery
    	jQuery = function( selector, context ) {

    		// The jQuery object is actually just the init constructor 'enhanced'
    		// Need init if jQuery is called (just allow error to be thrown if not included)
    		return new jQuery.fn.init( selector, context );
    	};

    jQuery.fn = jQuery.prototype = {

    	// The current version of jQuery being used
    	jquery: version,

    	constructor: jQuery,

    	// The default length of a jQuery object is 0
    	length: 0,

    	toArray: function() {
    		return slice.call( this );
    	},

    	// Get the Nth element in the matched element set OR
    	// Get the whole matched element set as a clean array
    	get: function( num ) {

    		// Return all the elements in a clean array
    		if ( num == null ) {
    			return slice.call( this );
    		}

    		// Return just the one element from the set
    		return num < 0 ? this[ num + this.length ] : this[ num ];
    	},

    	// Take an array of elements and push it onto the stack
    	// (returning the new matched element set)
    	pushStack: function( elems ) {

    		// Build a new jQuery matched element set
    		var ret = jQuery.merge( this.constructor(), elems );

    		// Add the old object onto the stack (as a reference)
    		ret.prevObject = this;

    		// Return the newly-formed element set
    		return ret;
    	},

    	// Execute a callback for every element in the matched set.
    	each: function( callback ) {
    		return jQuery.each( this, callback );
    	},

    	map: function( callback ) {
    		return this.pushStack( jQuery.map( this, function( elem, i ) {
    			return callback.call( elem, i, elem );
    		} ) );
    	},

    	slice: function() {
    		return this.pushStack( slice.apply( this, arguments ) );
    	},

    	first: function() {
    		return this.eq( 0 );
    	},

    	last: function() {
    		return this.eq( -1 );
    	},

    	even: function() {
    		return this.pushStack( jQuery.grep( this, function( _elem, i ) {
    			return ( i + 1 ) % 2;
    		} ) );
    	},

    	odd: function() {
    		return this.pushStack( jQuery.grep( this, function( _elem, i ) {
    			return i % 2;
    		} ) );
    	},

    	eq: function( i ) {
    		var len = this.length,
    			j = +i + ( i < 0 ? len : 0 );
    		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
    	},

    	end: function() {
    		return this.prevObject || this.constructor();
    	},

    	// For internal use only.
    	// Behaves like an Array's method, not like a jQuery method.
    	push: push,
    	sort: arr.sort,
    	splice: arr.splice
    };

    jQuery.extend = jQuery.fn.extend = function() {
    	var options, name, src, copy, copyIsArray, clone,
    		target = arguments[ 0 ] || {},
    		i = 1,
    		length = arguments.length,
    		deep = false;

    	// Handle a deep copy situation
    	if ( typeof target === "boolean" ) {
    		deep = target;

    		// Skip the boolean and the target
    		target = arguments[ i ] || {};
    		i++;
    	}

    	// Handle case when target is a string or something (possible in deep copy)
    	if ( typeof target !== "object" && !isFunction( target ) ) {
    		target = {};
    	}

    	// Extend jQuery itself if only one argument is passed
    	if ( i === length ) {
    		target = this;
    		i--;
    	}

    	for ( ; i < length; i++ ) {

    		// Only deal with non-null/undefined values
    		if ( ( options = arguments[ i ] ) != null ) {

    			// Extend the base object
    			for ( name in options ) {
    				copy = options[ name ];

    				// Prevent Object.prototype pollution
    				// Prevent never-ending loop
    				if ( name === "__proto__" || target === copy ) {
    					continue;
    				}

    				// Recurse if we're merging plain objects or arrays
    				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
    					( copyIsArray = Array.isArray( copy ) ) ) ) {
    					src = target[ name ];

    					// Ensure proper type for the source value
    					if ( copyIsArray && !Array.isArray( src ) ) {
    						clone = [];
    					} else if ( !copyIsArray && !jQuery.isPlainObject( src ) ) {
    						clone = {};
    					} else {
    						clone = src;
    					}
    					copyIsArray = false;

    					// Never move original objects, clone them
    					target[ name ] = jQuery.extend( deep, clone, copy );

    				// Don't bring in undefined values
    				} else if ( copy !== undefined ) {
    					target[ name ] = copy;
    				}
    			}
    		}
    	}

    	// Return the modified object
    	return target;
    };

    jQuery.extend( {

    	// Unique for each copy of jQuery on the page
    	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

    	// Assume jQuery is ready without the ready module
    	isReady: true,

    	error: function( msg ) {
    		throw new Error( msg );
    	},

    	noop: function() {},

    	isPlainObject: function( obj ) {
    		var proto, Ctor;

    		// Detect obvious negatives
    		// Use toString instead of jQuery.type to catch host objects
    		if ( !obj || toString.call( obj ) !== "[object Object]" ) {
    			return false;
    		}

    		proto = getProto( obj );

    		// Objects with no prototype (e.g., `Object.create( null )`) are plain
    		if ( !proto ) {
    			return true;
    		}

    		// Objects with prototype are plain iff they were constructed by a global Object function
    		Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
    		return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
    	},

    	isEmptyObject: function( obj ) {
    		var name;

    		for ( name in obj ) {
    			return false;
    		}
    		return true;
    	},

    	// Evaluates a script in a provided context; falls back to the global one
    	// if not specified.
    	globalEval: function( code, options, doc ) {
    		DOMEval( code, { nonce: options && options.nonce }, doc );
    	},

    	each: function( obj, callback ) {
    		var length, i = 0;

    		if ( isArrayLike( obj ) ) {
    			length = obj.length;
    			for ( ; i < length; i++ ) {
    				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
    					break;
    				}
    			}
    		} else {
    			for ( i in obj ) {
    				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
    					break;
    				}
    			}
    		}

    		return obj;
    	},

    	// results is for internal usage only
    	makeArray: function( arr, results ) {
    		var ret = results || [];

    		if ( arr != null ) {
    			if ( isArrayLike( Object( arr ) ) ) {
    				jQuery.merge( ret,
    					typeof arr === "string" ?
    						[ arr ] : arr
    				);
    			} else {
    				push.call( ret, arr );
    			}
    		}

    		return ret;
    	},

    	inArray: function( elem, arr, i ) {
    		return arr == null ? -1 : indexOf.call( arr, elem, i );
    	},

    	// Support: Android <=4.0 only, PhantomJS 1 only
    	// push.apply(_, arraylike) throws on ancient WebKit
    	merge: function( first, second ) {
    		var len = +second.length,
    			j = 0,
    			i = first.length;

    		for ( ; j < len; j++ ) {
    			first[ i++ ] = second[ j ];
    		}

    		first.length = i;

    		return first;
    	},

    	grep: function( elems, callback, invert ) {
    		var callbackInverse,
    			matches = [],
    			i = 0,
    			length = elems.length,
    			callbackExpect = !invert;

    		// Go through the array, only saving the items
    		// that pass the validator function
    		for ( ; i < length; i++ ) {
    			callbackInverse = !callback( elems[ i ], i );
    			if ( callbackInverse !== callbackExpect ) {
    				matches.push( elems[ i ] );
    			}
    		}

    		return matches;
    	},

    	// arg is for internal usage only
    	map: function( elems, callback, arg ) {
    		var length, value,
    			i = 0,
    			ret = [];

    		// Go through the array, translating each of the items to their new values
    		if ( isArrayLike( elems ) ) {
    			length = elems.length;
    			for ( ; i < length; i++ ) {
    				value = callback( elems[ i ], i, arg );

    				if ( value != null ) {
    					ret.push( value );
    				}
    			}

    		// Go through every key on the object,
    		} else {
    			for ( i in elems ) {
    				value = callback( elems[ i ], i, arg );

    				if ( value != null ) {
    					ret.push( value );
    				}
    			}
    		}

    		// Flatten any nested arrays
    		return flat( ret );
    	},

    	// A global GUID counter for objects
    	guid: 1,

    	// jQuery.support is not used in Core but other projects attach their
    	// properties to it so it needs to exist.
    	support: support
    } );

    if ( typeof Symbol === "function" ) {
    	jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
    }

    // Populate the class2type map
    jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
    	function( _i, name ) {
    		class2type[ "[object " + name + "]" ] = name.toLowerCase();
    	} );

    function isArrayLike( obj ) {

    	// Support: real iOS 8.2 only (not reproducible in simulator)
    	// `in` check used to prevent JIT error (gh-2145)
    	// hasOwn isn't used here due to false negatives
    	// regarding Nodelist length in IE
    	var length = !!obj && "length" in obj && obj.length,
    		type = toType( obj );

    	if ( isFunction( obj ) || isWindow( obj ) ) {
    		return false;
    	}

    	return type === "array" || length === 0 ||
    		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
    }
    var Sizzle =
    /*!
     * Sizzle CSS Selector Engine v2.3.6
     * https://sizzlejs.com/
     *
     * Copyright JS Foundation and other contributors
     * Released under the MIT license
     * https://js.foundation/
     *
     * Date: 2021-02-16
     */
    ( function( window ) {
    var i,
    	support,
    	Expr,
    	getText,
    	isXML,
    	tokenize,
    	compile,
    	select,
    	outermostContext,
    	sortInput,
    	hasDuplicate,

    	// Local document vars
    	setDocument,
    	document,
    	docElem,
    	documentIsHTML,
    	rbuggyQSA,
    	rbuggyMatches,
    	matches,
    	contains,

    	// Instance-specific data
    	expando = "sizzle" + 1 * new Date(),
    	preferredDoc = window.document,
    	dirruns = 0,
    	done = 0,
    	classCache = createCache(),
    	tokenCache = createCache(),
    	compilerCache = createCache(),
    	nonnativeSelectorCache = createCache(),
    	sortOrder = function( a, b ) {
    		if ( a === b ) {
    			hasDuplicate = true;
    		}
    		return 0;
    	},

    	// Instance methods
    	hasOwn = ( {} ).hasOwnProperty,
    	arr = [],
    	pop = arr.pop,
    	pushNative = arr.push,
    	push = arr.push,
    	slice = arr.slice,

    	// Use a stripped-down indexOf as it's faster than native
    	// https://jsperf.com/thor-indexof-vs-for/5
    	indexOf = function( list, elem ) {
    		var i = 0,
    			len = list.length;
    		for ( ; i < len; i++ ) {
    			if ( list[ i ] === elem ) {
    				return i;
    			}
    		}
    		return -1;
    	},

    	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|" +
    		"ismap|loop|multiple|open|readonly|required|scoped",

    	// Regular expressions

    	// http://www.w3.org/TR/css3-selectors/#whitespace
    	whitespace = "[\\x20\\t\\r\\n\\f]",

    	// https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
    	identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace +
    		"?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",

    	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
    	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +

    		// Operator (capture 2)
    		"*([*^$|!~]?=)" + whitespace +

    		// "Attribute values must be CSS identifiers [capture 5]
    		// or strings [capture 3 or capture 4]"
    		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" +
    		whitespace + "*\\]",

    	pseudos = ":(" + identifier + ")(?:\\((" +

    		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
    		// 1. quoted (capture 3; capture 4 or capture 5)
    		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +

    		// 2. simple (capture 6)
    		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +

    		// 3. anything else (capture 2)
    		".*" +
    		")\\)|)",

    	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
    	rwhitespace = new RegExp( whitespace + "+", "g" ),
    	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" +
    		whitespace + "+$", "g" ),

    	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
    	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace +
    		"*" ),
    	rdescend = new RegExp( whitespace + "|>" ),

    	rpseudo = new RegExp( pseudos ),
    	ridentifier = new RegExp( "^" + identifier + "$" ),

    	matchExpr = {
    		"ID": new RegExp( "^#(" + identifier + ")" ),
    		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
    		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
    		"ATTR": new RegExp( "^" + attributes ),
    		"PSEUDO": new RegExp( "^" + pseudos ),
    		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" +
    			whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" +
    			whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
    		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),

    		// For use in libraries implementing .is()
    		// We use this for POS matching in `select`
    		"needsContext": new RegExp( "^" + whitespace +
    			"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
    			"*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
    	},

    	rhtml = /HTML$/i,
    	rinputs = /^(?:input|select|textarea|button)$/i,
    	rheader = /^h\d$/i,

    	rnative = /^[^{]+\{\s*\[native \w/,

    	// Easily-parseable/retrievable ID or TAG or CLASS selectors
    	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

    	rsibling = /[+~]/,

    	// CSS escapes
    	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
    	runescape = new RegExp( "\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\r\\n\\f])", "g" ),
    	funescape = function( escape, nonHex ) {
    		var high = "0x" + escape.slice( 1 ) - 0x10000;

    		return nonHex ?

    			// Strip the backslash prefix from a non-hex escape sequence
    			nonHex :

    			// Replace a hexadecimal escape sequence with the encoded Unicode code point
    			// Support: IE <=11+
    			// For values outside the Basic Multilingual Plane (BMP), manually construct a
    			// surrogate pair
    			high < 0 ?
    				String.fromCharCode( high + 0x10000 ) :
    				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
    	},

    	// CSS string/identifier serialization
    	// https://drafts.csswg.org/cssom/#common-serializing-idioms
    	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
    	fcssescape = function( ch, asCodePoint ) {
    		if ( asCodePoint ) {

    			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
    			if ( ch === "\0" ) {
    				return "\uFFFD";
    			}

    			// Control characters and (dependent upon position) numbers get escaped as code points
    			return ch.slice( 0, -1 ) + "\\" +
    				ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
    		}

    		// Other potentially-special ASCII characters get backslash-escaped
    		return "\\" + ch;
    	},

    	// Used for iframes
    	// See setDocument()
    	// Removing the function wrapper causes a "Permission Denied"
    	// error in IE
    	unloadHandler = function() {
    		setDocument();
    	},

    	inDisabledFieldset = addCombinator(
    		function( elem ) {
    			return elem.disabled === true && elem.nodeName.toLowerCase() === "fieldset";
    		},
    		{ dir: "parentNode", next: "legend" }
    	);

    // Optimize for push.apply( _, NodeList )
    try {
    	push.apply(
    		( arr = slice.call( preferredDoc.childNodes ) ),
    		preferredDoc.childNodes
    	);

    	// Support: Android<4.0
    	// Detect silently failing push.apply
    	// eslint-disable-next-line no-unused-expressions
    	arr[ preferredDoc.childNodes.length ].nodeType;
    } catch ( e ) {
    	push = { apply: arr.length ?

    		// Leverage slice if possible
    		function( target, els ) {
    			pushNative.apply( target, slice.call( els ) );
    		} :

    		// Support: IE<9
    		// Otherwise append directly
    		function( target, els ) {
    			var j = target.length,
    				i = 0;

    			// Can't trust NodeList.length
    			while ( ( target[ j++ ] = els[ i++ ] ) ) {}
    			target.length = j - 1;
    		}
    	};
    }

    function Sizzle( selector, context, results, seed ) {
    	var m, i, elem, nid, match, groups, newSelector,
    		newContext = context && context.ownerDocument,

    		// nodeType defaults to 9, since context defaults to document
    		nodeType = context ? context.nodeType : 9;

    	results = results || [];

    	// Return early from calls with invalid selector or context
    	if ( typeof selector !== "string" || !selector ||
    		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

    		return results;
    	}

    	// Try to shortcut find operations (as opposed to filters) in HTML documents
    	if ( !seed ) {
    		setDocument( context );
    		context = context || document;

    		if ( documentIsHTML ) {

    			// If the selector is sufficiently simple, try using a "get*By*" DOM method
    			// (excepting DocumentFragment context, where the methods don't exist)
    			if ( nodeType !== 11 && ( match = rquickExpr.exec( selector ) ) ) {

    				// ID selector
    				if ( ( m = match[ 1 ] ) ) {

    					// Document context
    					if ( nodeType === 9 ) {
    						if ( ( elem = context.getElementById( m ) ) ) {

    							// Support: IE, Opera, Webkit
    							// TODO: identify versions
    							// getElementById can match elements by name instead of ID
    							if ( elem.id === m ) {
    								results.push( elem );
    								return results;
    							}
    						} else {
    							return results;
    						}

    					// Element context
    					} else {

    						// Support: IE, Opera, Webkit
    						// TODO: identify versions
    						// getElementById can match elements by name instead of ID
    						if ( newContext && ( elem = newContext.getElementById( m ) ) &&
    							contains( context, elem ) &&
    							elem.id === m ) {

    							results.push( elem );
    							return results;
    						}
    					}

    				// Type selector
    				} else if ( match[ 2 ] ) {
    					push.apply( results, context.getElementsByTagName( selector ) );
    					return results;

    				// Class selector
    				} else if ( ( m = match[ 3 ] ) && support.getElementsByClassName &&
    					context.getElementsByClassName ) {

    					push.apply( results, context.getElementsByClassName( m ) );
    					return results;
    				}
    			}

    			// Take advantage of querySelectorAll
    			if ( support.qsa &&
    				!nonnativeSelectorCache[ selector + " " ] &&
    				( !rbuggyQSA || !rbuggyQSA.test( selector ) ) &&

    				// Support: IE 8 only
    				// Exclude object elements
    				( nodeType !== 1 || context.nodeName.toLowerCase() !== "object" ) ) {

    				newSelector = selector;
    				newContext = context;

    				// qSA considers elements outside a scoping root when evaluating child or
    				// descendant combinators, which is not what we want.
    				// In such cases, we work around the behavior by prefixing every selector in the
    				// list with an ID selector referencing the scope context.
    				// The technique has to be used as well when a leading combinator is used
    				// as such selectors are not recognized by querySelectorAll.
    				// Thanks to Andrew Dupont for this technique.
    				if ( nodeType === 1 &&
    					( rdescend.test( selector ) || rcombinators.test( selector ) ) ) {

    					// Expand context for sibling selectors
    					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
    						context;

    					// We can use :scope instead of the ID hack if the browser
    					// supports it & if we're not changing the context.
    					if ( newContext !== context || !support.scope ) {

    						// Capture the context ID, setting it first if necessary
    						if ( ( nid = context.getAttribute( "id" ) ) ) {
    							nid = nid.replace( rcssescape, fcssescape );
    						} else {
    							context.setAttribute( "id", ( nid = expando ) );
    						}
    					}

    					// Prefix every selector in the list
    					groups = tokenize( selector );
    					i = groups.length;
    					while ( i-- ) {
    						groups[ i ] = ( nid ? "#" + nid : ":scope" ) + " " +
    							toSelector( groups[ i ] );
    					}
    					newSelector = groups.join( "," );
    				}

    				try {
    					push.apply( results,
    						newContext.querySelectorAll( newSelector )
    					);
    					return results;
    				} catch ( qsaError ) {
    					nonnativeSelectorCache( selector, true );
    				} finally {
    					if ( nid === expando ) {
    						context.removeAttribute( "id" );
    					}
    				}
    			}
    		}
    	}

    	// All others
    	return select( selector.replace( rtrim, "$1" ), context, results, seed );
    }

    /**
     * Create key-value caches of limited size
     * @returns {function(string, object)} Returns the Object data after storing it on itself with
     *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
     *	deleting the oldest entry
     */
    function createCache() {
    	var keys = [];

    	function cache( key, value ) {

    		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
    		if ( keys.push( key + " " ) > Expr.cacheLength ) {

    			// Only keep the most recent entries
    			delete cache[ keys.shift() ];
    		}
    		return ( cache[ key + " " ] = value );
    	}
    	return cache;
    }

    /**
     * Mark a function for special use by Sizzle
     * @param {Function} fn The function to mark
     */
    function markFunction( fn ) {
    	fn[ expando ] = true;
    	return fn;
    }

    /**
     * Support testing using an element
     * @param {Function} fn Passed the created element and returns a boolean result
     */
    function assert( fn ) {
    	var el = document.createElement( "fieldset" );

    	try {
    		return !!fn( el );
    	} catch ( e ) {
    		return false;
    	} finally {

    		// Remove from its parent by default
    		if ( el.parentNode ) {
    			el.parentNode.removeChild( el );
    		}

    		// release memory in IE
    		el = null;
    	}
    }

    /**
     * Adds the same handler for all of the specified attrs
     * @param {String} attrs Pipe-separated list of attributes
     * @param {Function} handler The method that will be applied
     */
    function addHandle( attrs, handler ) {
    	var arr = attrs.split( "|" ),
    		i = arr.length;

    	while ( i-- ) {
    		Expr.attrHandle[ arr[ i ] ] = handler;
    	}
    }

    /**
     * Checks document order of two siblings
     * @param {Element} a
     * @param {Element} b
     * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
     */
    function siblingCheck( a, b ) {
    	var cur = b && a,
    		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
    			a.sourceIndex - b.sourceIndex;

    	// Use IE sourceIndex if available on both nodes
    	if ( diff ) {
    		return diff;
    	}

    	// Check if b follows a
    	if ( cur ) {
    		while ( ( cur = cur.nextSibling ) ) {
    			if ( cur === b ) {
    				return -1;
    			}
    		}
    	}

    	return a ? 1 : -1;
    }

    /**
     * Returns a function to use in pseudos for input types
     * @param {String} type
     */
    function createInputPseudo( type ) {
    	return function( elem ) {
    		var name = elem.nodeName.toLowerCase();
    		return name === "input" && elem.type === type;
    	};
    }

    /**
     * Returns a function to use in pseudos for buttons
     * @param {String} type
     */
    function createButtonPseudo( type ) {
    	return function( elem ) {
    		var name = elem.nodeName.toLowerCase();
    		return ( name === "input" || name === "button" ) && elem.type === type;
    	};
    }

    /**
     * Returns a function to use in pseudos for :enabled/:disabled
     * @param {Boolean} disabled true for :disabled; false for :enabled
     */
    function createDisabledPseudo( disabled ) {

    	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
    	return function( elem ) {

    		// Only certain elements can match :enabled or :disabled
    		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
    		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
    		if ( "form" in elem ) {

    			// Check for inherited disabledness on relevant non-disabled elements:
    			// * listed form-associated elements in a disabled fieldset
    			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
    			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
    			// * option elements in a disabled optgroup
    			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
    			// All such elements have a "form" property.
    			if ( elem.parentNode && elem.disabled === false ) {

    				// Option elements defer to a parent optgroup if present
    				if ( "label" in elem ) {
    					if ( "label" in elem.parentNode ) {
    						return elem.parentNode.disabled === disabled;
    					} else {
    						return elem.disabled === disabled;
    					}
    				}

    				// Support: IE 6 - 11
    				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
    				return elem.isDisabled === disabled ||

    					// Where there is no isDisabled, check manually
    					/* jshint -W018 */
    					elem.isDisabled !== !disabled &&
    					inDisabledFieldset( elem ) === disabled;
    			}

    			return elem.disabled === disabled;

    		// Try to winnow out elements that can't be disabled before trusting the disabled property.
    		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
    		// even exist on them, let alone have a boolean value.
    		} else if ( "label" in elem ) {
    			return elem.disabled === disabled;
    		}

    		// Remaining elements are neither :enabled nor :disabled
    		return false;
    	};
    }

    /**
     * Returns a function to use in pseudos for positionals
     * @param {Function} fn
     */
    function createPositionalPseudo( fn ) {
    	return markFunction( function( argument ) {
    		argument = +argument;
    		return markFunction( function( seed, matches ) {
    			var j,
    				matchIndexes = fn( [], seed.length, argument ),
    				i = matchIndexes.length;

    			// Match elements found at the specified indexes
    			while ( i-- ) {
    				if ( seed[ ( j = matchIndexes[ i ] ) ] ) {
    					seed[ j ] = !( matches[ j ] = seed[ j ] );
    				}
    			}
    		} );
    	} );
    }

    /**
     * Checks a node for validity as a Sizzle context
     * @param {Element|Object=} context
     * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
     */
    function testContext( context ) {
    	return context && typeof context.getElementsByTagName !== "undefined" && context;
    }

    // Expose support vars for convenience
    support = Sizzle.support = {};

    /**
     * Detects XML nodes
     * @param {Element|Object} elem An element or a document
     * @returns {Boolean} True iff elem is a non-HTML XML node
     */
    isXML = Sizzle.isXML = function( elem ) {
    	var namespace = elem && elem.namespaceURI,
    		docElem = elem && ( elem.ownerDocument || elem ).documentElement;

    	// Support: IE <=8
    	// Assume HTML when documentElement doesn't yet exist, such as inside loading iframes
    	// https://bugs.jquery.com/ticket/4833
    	return !rhtml.test( namespace || docElem && docElem.nodeName || "HTML" );
    };

    /**
     * Sets document-related variables once based on the current document
     * @param {Element|Object} [doc] An element or document object to use to set the document
     * @returns {Object} Returns the current document
     */
    setDocument = Sizzle.setDocument = function( node ) {
    	var hasCompare, subWindow,
    		doc = node ? node.ownerDocument || node : preferredDoc;

    	// Return early if doc is invalid or already selected
    	// Support: IE 11+, Edge 17 - 18+
    	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    	// two documents; shallow comparisons work.
    	// eslint-disable-next-line eqeqeq
    	if ( doc == document || doc.nodeType !== 9 || !doc.documentElement ) {
    		return document;
    	}

    	// Update global variables
    	document = doc;
    	docElem = document.documentElement;
    	documentIsHTML = !isXML( document );

    	// Support: IE 9 - 11+, Edge 12 - 18+
    	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
    	// Support: IE 11+, Edge 17 - 18+
    	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    	// two documents; shallow comparisons work.
    	// eslint-disable-next-line eqeqeq
    	if ( preferredDoc != document &&
    		( subWindow = document.defaultView ) && subWindow.top !== subWindow ) {

    		// Support: IE 11, Edge
    		if ( subWindow.addEventListener ) {
    			subWindow.addEventListener( "unload", unloadHandler, false );

    		// Support: IE 9 - 10 only
    		} else if ( subWindow.attachEvent ) {
    			subWindow.attachEvent( "onunload", unloadHandler );
    		}
    	}

    	// Support: IE 8 - 11+, Edge 12 - 18+, Chrome <=16 - 25 only, Firefox <=3.6 - 31 only,
    	// Safari 4 - 5 only, Opera <=11.6 - 12.x only
    	// IE/Edge & older browsers don't support the :scope pseudo-class.
    	// Support: Safari 6.0 only
    	// Safari 6.0 supports :scope but it's an alias of :root there.
    	support.scope = assert( function( el ) {
    		docElem.appendChild( el ).appendChild( document.createElement( "div" ) );
    		return typeof el.querySelectorAll !== "undefined" &&
    			!el.querySelectorAll( ":scope fieldset div" ).length;
    	} );

    	/* Attributes
    	---------------------------------------------------------------------- */

    	// Support: IE<8
    	// Verify that getAttribute really returns attributes and not properties
    	// (excepting IE8 booleans)
    	support.attributes = assert( function( el ) {
    		el.className = "i";
    		return !el.getAttribute( "className" );
    	} );

    	/* getElement(s)By*
    	---------------------------------------------------------------------- */

    	// Check if getElementsByTagName("*") returns only elements
    	support.getElementsByTagName = assert( function( el ) {
    		el.appendChild( document.createComment( "" ) );
    		return !el.getElementsByTagName( "*" ).length;
    	} );

    	// Support: IE<9
    	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

    	// Support: IE<10
    	// Check if getElementById returns elements by name
    	// The broken getElementById methods don't pick up programmatically-set names,
    	// so use a roundabout getElementsByName test
    	support.getById = assert( function( el ) {
    		docElem.appendChild( el ).id = expando;
    		return !document.getElementsByName || !document.getElementsByName( expando ).length;
    	} );

    	// ID filter and find
    	if ( support.getById ) {
    		Expr.filter[ "ID" ] = function( id ) {
    			var attrId = id.replace( runescape, funescape );
    			return function( elem ) {
    				return elem.getAttribute( "id" ) === attrId;
    			};
    		};
    		Expr.find[ "ID" ] = function( id, context ) {
    			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
    				var elem = context.getElementById( id );
    				return elem ? [ elem ] : [];
    			}
    		};
    	} else {
    		Expr.filter[ "ID" ] =  function( id ) {
    			var attrId = id.replace( runescape, funescape );
    			return function( elem ) {
    				var node = typeof elem.getAttributeNode !== "undefined" &&
    					elem.getAttributeNode( "id" );
    				return node && node.value === attrId;
    			};
    		};

    		// Support: IE 6 - 7 only
    		// getElementById is not reliable as a find shortcut
    		Expr.find[ "ID" ] = function( id, context ) {
    			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
    				var node, i, elems,
    					elem = context.getElementById( id );

    				if ( elem ) {

    					// Verify the id attribute
    					node = elem.getAttributeNode( "id" );
    					if ( node && node.value === id ) {
    						return [ elem ];
    					}

    					// Fall back on getElementsByName
    					elems = context.getElementsByName( id );
    					i = 0;
    					while ( ( elem = elems[ i++ ] ) ) {
    						node = elem.getAttributeNode( "id" );
    						if ( node && node.value === id ) {
    							return [ elem ];
    						}
    					}
    				}

    				return [];
    			}
    		};
    	}

    	// Tag
    	Expr.find[ "TAG" ] = support.getElementsByTagName ?
    		function( tag, context ) {
    			if ( typeof context.getElementsByTagName !== "undefined" ) {
    				return context.getElementsByTagName( tag );

    			// DocumentFragment nodes don't have gEBTN
    			} else if ( support.qsa ) {
    				return context.querySelectorAll( tag );
    			}
    		} :

    		function( tag, context ) {
    			var elem,
    				tmp = [],
    				i = 0,

    				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
    				results = context.getElementsByTagName( tag );

    			// Filter out possible comments
    			if ( tag === "*" ) {
    				while ( ( elem = results[ i++ ] ) ) {
    					if ( elem.nodeType === 1 ) {
    						tmp.push( elem );
    					}
    				}

    				return tmp;
    			}
    			return results;
    		};

    	// Class
    	Expr.find[ "CLASS" ] = support.getElementsByClassName && function( className, context ) {
    		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
    			return context.getElementsByClassName( className );
    		}
    	};

    	/* QSA/matchesSelector
    	---------------------------------------------------------------------- */

    	// QSA and matchesSelector support

    	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
    	rbuggyMatches = [];

    	// qSa(:focus) reports false when true (Chrome 21)
    	// We allow this because of a bug in IE8/9 that throws an error
    	// whenever `document.activeElement` is accessed on an iframe
    	// So, we allow :focus to pass through QSA all the time to avoid the IE error
    	// See https://bugs.jquery.com/ticket/13378
    	rbuggyQSA = [];

    	if ( ( support.qsa = rnative.test( document.querySelectorAll ) ) ) {

    		// Build QSA regex
    		// Regex strategy adopted from Diego Perini
    		assert( function( el ) {

    			var input;

    			// Select is set to empty string on purpose
    			// This is to test IE's treatment of not explicitly
    			// setting a boolean content attribute,
    			// since its presence should be enough
    			// https://bugs.jquery.com/ticket/12359
    			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
    				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
    				"<option selected=''></option></select>";

    			// Support: IE8, Opera 11-12.16
    			// Nothing should be selected when empty strings follow ^= or $= or *=
    			// The test attribute must be unknown in Opera but "safe" for WinRT
    			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
    			if ( el.querySelectorAll( "[msallowcapture^='']" ).length ) {
    				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
    			}

    			// Support: IE8
    			// Boolean attributes and "value" are not treated correctly
    			if ( !el.querySelectorAll( "[selected]" ).length ) {
    				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
    			}

    			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
    			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
    				rbuggyQSA.push( "~=" );
    			}

    			// Support: IE 11+, Edge 15 - 18+
    			// IE 11/Edge don't find elements on a `[name='']` query in some cases.
    			// Adding a temporary attribute to the document before the selection works
    			// around the issue.
    			// Interestingly, IE 10 & older don't seem to have the issue.
    			input = document.createElement( "input" );
    			input.setAttribute( "name", "" );
    			el.appendChild( input );
    			if ( !el.querySelectorAll( "[name='']" ).length ) {
    				rbuggyQSA.push( "\\[" + whitespace + "*name" + whitespace + "*=" +
    					whitespace + "*(?:''|\"\")" );
    			}

    			// Webkit/Opera - :checked should return selected option elements
    			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
    			// IE8 throws error here and will not see later tests
    			if ( !el.querySelectorAll( ":checked" ).length ) {
    				rbuggyQSA.push( ":checked" );
    			}

    			// Support: Safari 8+, iOS 8+
    			// https://bugs.webkit.org/show_bug.cgi?id=136851
    			// In-page `selector#id sibling-combinator selector` fails
    			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
    				rbuggyQSA.push( ".#.+[+~]" );
    			}

    			// Support: Firefox <=3.6 - 5 only
    			// Old Firefox doesn't throw on a badly-escaped identifier.
    			el.querySelectorAll( "\\\f" );
    			rbuggyQSA.push( "[\\r\\n\\f]" );
    		} );

    		assert( function( el ) {
    			el.innerHTML = "<a href='' disabled='disabled'></a>" +
    				"<select disabled='disabled'><option/></select>";

    			// Support: Windows 8 Native Apps
    			// The type and name attributes are restricted during .innerHTML assignment
    			var input = document.createElement( "input" );
    			input.setAttribute( "type", "hidden" );
    			el.appendChild( input ).setAttribute( "name", "D" );

    			// Support: IE8
    			// Enforce case-sensitivity of name attribute
    			if ( el.querySelectorAll( "[name=d]" ).length ) {
    				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
    			}

    			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
    			// IE8 throws error here and will not see later tests
    			if ( el.querySelectorAll( ":enabled" ).length !== 2 ) {
    				rbuggyQSA.push( ":enabled", ":disabled" );
    			}

    			// Support: IE9-11+
    			// IE's :disabled selector does not pick up the children of disabled fieldsets
    			docElem.appendChild( el ).disabled = true;
    			if ( el.querySelectorAll( ":disabled" ).length !== 2 ) {
    				rbuggyQSA.push( ":enabled", ":disabled" );
    			}

    			// Support: Opera 10 - 11 only
    			// Opera 10-11 does not throw on post-comma invalid pseudos
    			el.querySelectorAll( "*,:x" );
    			rbuggyQSA.push( ",.*:" );
    		} );
    	}

    	if ( ( support.matchesSelector = rnative.test( ( matches = docElem.matches ||
    		docElem.webkitMatchesSelector ||
    		docElem.mozMatchesSelector ||
    		docElem.oMatchesSelector ||
    		docElem.msMatchesSelector ) ) ) ) {

    		assert( function( el ) {

    			// Check to see if it's possible to do matchesSelector
    			// on a disconnected node (IE 9)
    			support.disconnectedMatch = matches.call( el, "*" );

    			// This should fail with an exception
    			// Gecko does not error, returns false instead
    			matches.call( el, "[s!='']:x" );
    			rbuggyMatches.push( "!=", pseudos );
    		} );
    	}

    	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join( "|" ) );
    	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join( "|" ) );

    	/* Contains
    	---------------------------------------------------------------------- */
    	hasCompare = rnative.test( docElem.compareDocumentPosition );

    	// Element contains another
    	// Purposefully self-exclusive
    	// As in, an element does not contain itself
    	contains = hasCompare || rnative.test( docElem.contains ) ?
    		function( a, b ) {
    			var adown = a.nodeType === 9 ? a.documentElement : a,
    				bup = b && b.parentNode;
    			return a === bup || !!( bup && bup.nodeType === 1 && (
    				adown.contains ?
    					adown.contains( bup ) :
    					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
    			) );
    		} :
    		function( a, b ) {
    			if ( b ) {
    				while ( ( b = b.parentNode ) ) {
    					if ( b === a ) {
    						return true;
    					}
    				}
    			}
    			return false;
    		};

    	/* Sorting
    	---------------------------------------------------------------------- */

    	// Document order sorting
    	sortOrder = hasCompare ?
    	function( a, b ) {

    		// Flag for duplicate removal
    		if ( a === b ) {
    			hasDuplicate = true;
    			return 0;
    		}

    		// Sort on method existence if only one input has compareDocumentPosition
    		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
    		if ( compare ) {
    			return compare;
    		}

    		// Calculate position if both inputs belong to the same document
    		// Support: IE 11+, Edge 17 - 18+
    		// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    		// two documents; shallow comparisons work.
    		// eslint-disable-next-line eqeqeq
    		compare = ( a.ownerDocument || a ) == ( b.ownerDocument || b ) ?
    			a.compareDocumentPosition( b ) :

    			// Otherwise we know they are disconnected
    			1;

    		// Disconnected nodes
    		if ( compare & 1 ||
    			( !support.sortDetached && b.compareDocumentPosition( a ) === compare ) ) {

    			// Choose the first element that is related to our preferred document
    			// Support: IE 11+, Edge 17 - 18+
    			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    			// two documents; shallow comparisons work.
    			// eslint-disable-next-line eqeqeq
    			if ( a == document || a.ownerDocument == preferredDoc &&
    				contains( preferredDoc, a ) ) {
    				return -1;
    			}

    			// Support: IE 11+, Edge 17 - 18+
    			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    			// two documents; shallow comparisons work.
    			// eslint-disable-next-line eqeqeq
    			if ( b == document || b.ownerDocument == preferredDoc &&
    				contains( preferredDoc, b ) ) {
    				return 1;
    			}

    			// Maintain original order
    			return sortInput ?
    				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
    				0;
    		}

    		return compare & 4 ? -1 : 1;
    	} :
    	function( a, b ) {

    		// Exit early if the nodes are identical
    		if ( a === b ) {
    			hasDuplicate = true;
    			return 0;
    		}

    		var cur,
    			i = 0,
    			aup = a.parentNode,
    			bup = b.parentNode,
    			ap = [ a ],
    			bp = [ b ];

    		// Parentless nodes are either documents or disconnected
    		if ( !aup || !bup ) {

    			// Support: IE 11+, Edge 17 - 18+
    			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    			// two documents; shallow comparisons work.
    			/* eslint-disable eqeqeq */
    			return a == document ? -1 :
    				b == document ? 1 :
    				/* eslint-enable eqeqeq */
    				aup ? -1 :
    				bup ? 1 :
    				sortInput ?
    				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
    				0;

    		// If the nodes are siblings, we can do a quick check
    		} else if ( aup === bup ) {
    			return siblingCheck( a, b );
    		}

    		// Otherwise we need full lists of their ancestors for comparison
    		cur = a;
    		while ( ( cur = cur.parentNode ) ) {
    			ap.unshift( cur );
    		}
    		cur = b;
    		while ( ( cur = cur.parentNode ) ) {
    			bp.unshift( cur );
    		}

    		// Walk down the tree looking for a discrepancy
    		while ( ap[ i ] === bp[ i ] ) {
    			i++;
    		}

    		return i ?

    			// Do a sibling check if the nodes have a common ancestor
    			siblingCheck( ap[ i ], bp[ i ] ) :

    			// Otherwise nodes in our document sort first
    			// Support: IE 11+, Edge 17 - 18+
    			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    			// two documents; shallow comparisons work.
    			/* eslint-disable eqeqeq */
    			ap[ i ] == preferredDoc ? -1 :
    			bp[ i ] == preferredDoc ? 1 :
    			/* eslint-enable eqeqeq */
    			0;
    	};

    	return document;
    };

    Sizzle.matches = function( expr, elements ) {
    	return Sizzle( expr, null, null, elements );
    };

    Sizzle.matchesSelector = function( elem, expr ) {
    	setDocument( elem );

    	if ( support.matchesSelector && documentIsHTML &&
    		!nonnativeSelectorCache[ expr + " " ] &&
    		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
    		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

    		try {
    			var ret = matches.call( elem, expr );

    			// IE 9's matchesSelector returns false on disconnected nodes
    			if ( ret || support.disconnectedMatch ||

    				// As well, disconnected nodes are said to be in a document
    				// fragment in IE 9
    				elem.document && elem.document.nodeType !== 11 ) {
    				return ret;
    			}
    		} catch ( e ) {
    			nonnativeSelectorCache( expr, true );
    		}
    	}

    	return Sizzle( expr, document, null, [ elem ] ).length > 0;
    };

    Sizzle.contains = function( context, elem ) {

    	// Set document vars if needed
    	// Support: IE 11+, Edge 17 - 18+
    	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    	// two documents; shallow comparisons work.
    	// eslint-disable-next-line eqeqeq
    	if ( ( context.ownerDocument || context ) != document ) {
    		setDocument( context );
    	}
    	return contains( context, elem );
    };

    Sizzle.attr = function( elem, name ) {

    	// Set document vars if needed
    	// Support: IE 11+, Edge 17 - 18+
    	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    	// two documents; shallow comparisons work.
    	// eslint-disable-next-line eqeqeq
    	if ( ( elem.ownerDocument || elem ) != document ) {
    		setDocument( elem );
    	}

    	var fn = Expr.attrHandle[ name.toLowerCase() ],

    		// Don't get fooled by Object.prototype properties (jQuery #13807)
    		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
    			fn( elem, name, !documentIsHTML ) :
    			undefined;

    	return val !== undefined ?
    		val :
    		support.attributes || !documentIsHTML ?
    			elem.getAttribute( name ) :
    			( val = elem.getAttributeNode( name ) ) && val.specified ?
    				val.value :
    				null;
    };

    Sizzle.escape = function( sel ) {
    	return ( sel + "" ).replace( rcssescape, fcssescape );
    };

    Sizzle.error = function( msg ) {
    	throw new Error( "Syntax error, unrecognized expression: " + msg );
    };

    /**
     * Document sorting and removing duplicates
     * @param {ArrayLike} results
     */
    Sizzle.uniqueSort = function( results ) {
    	var elem,
    		duplicates = [],
    		j = 0,
    		i = 0;

    	// Unless we *know* we can detect duplicates, assume their presence
    	hasDuplicate = !support.detectDuplicates;
    	sortInput = !support.sortStable && results.slice( 0 );
    	results.sort( sortOrder );

    	if ( hasDuplicate ) {
    		while ( ( elem = results[ i++ ] ) ) {
    			if ( elem === results[ i ] ) {
    				j = duplicates.push( i );
    			}
    		}
    		while ( j-- ) {
    			results.splice( duplicates[ j ], 1 );
    		}
    	}

    	// Clear input after sorting to release objects
    	// See https://github.com/jquery/sizzle/pull/225
    	sortInput = null;

    	return results;
    };

    /**
     * Utility function for retrieving the text value of an array of DOM nodes
     * @param {Array|Element} elem
     */
    getText = Sizzle.getText = function( elem ) {
    	var node,
    		ret = "",
    		i = 0,
    		nodeType = elem.nodeType;

    	if ( !nodeType ) {

    		// If no nodeType, this is expected to be an array
    		while ( ( node = elem[ i++ ] ) ) {

    			// Do not traverse comment nodes
    			ret += getText( node );
    		}
    	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {

    		// Use textContent for elements
    		// innerText usage removed for consistency of new lines (jQuery #11153)
    		if ( typeof elem.textContent === "string" ) {
    			return elem.textContent;
    		} else {

    			// Traverse its children
    			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
    				ret += getText( elem );
    			}
    		}
    	} else if ( nodeType === 3 || nodeType === 4 ) {
    		return elem.nodeValue;
    	}

    	// Do not include comment or processing instruction nodes

    	return ret;
    };

    Expr = Sizzle.selectors = {

    	// Can be adjusted by the user
    	cacheLength: 50,

    	createPseudo: markFunction,

    	match: matchExpr,

    	attrHandle: {},

    	find: {},

    	relative: {
    		">": { dir: "parentNode", first: true },
    		" ": { dir: "parentNode" },
    		"+": { dir: "previousSibling", first: true },
    		"~": { dir: "previousSibling" }
    	},

    	preFilter: {
    		"ATTR": function( match ) {
    			match[ 1 ] = match[ 1 ].replace( runescape, funescape );

    			// Move the given value to match[3] whether quoted or unquoted
    			match[ 3 ] = ( match[ 3 ] || match[ 4 ] ||
    				match[ 5 ] || "" ).replace( runescape, funescape );

    			if ( match[ 2 ] === "~=" ) {
    				match[ 3 ] = " " + match[ 3 ] + " ";
    			}

    			return match.slice( 0, 4 );
    		},

    		"CHILD": function( match ) {

    			/* matches from matchExpr["CHILD"]
    				1 type (only|nth|...)
    				2 what (child|of-type)
    				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
    				4 xn-component of xn+y argument ([+-]?\d*n|)
    				5 sign of xn-component
    				6 x of xn-component
    				7 sign of y-component
    				8 y of y-component
    			*/
    			match[ 1 ] = match[ 1 ].toLowerCase();

    			if ( match[ 1 ].slice( 0, 3 ) === "nth" ) {

    				// nth-* requires argument
    				if ( !match[ 3 ] ) {
    					Sizzle.error( match[ 0 ] );
    				}

    				// numeric x and y parameters for Expr.filter.CHILD
    				// remember that false/true cast respectively to 0/1
    				match[ 4 ] = +( match[ 4 ] ?
    					match[ 5 ] + ( match[ 6 ] || 1 ) :
    					2 * ( match[ 3 ] === "even" || match[ 3 ] === "odd" ) );
    				match[ 5 ] = +( ( match[ 7 ] + match[ 8 ] ) || match[ 3 ] === "odd" );

    				// other types prohibit arguments
    			} else if ( match[ 3 ] ) {
    				Sizzle.error( match[ 0 ] );
    			}

    			return match;
    		},

    		"PSEUDO": function( match ) {
    			var excess,
    				unquoted = !match[ 6 ] && match[ 2 ];

    			if ( matchExpr[ "CHILD" ].test( match[ 0 ] ) ) {
    				return null;
    			}

    			// Accept quoted arguments as-is
    			if ( match[ 3 ] ) {
    				match[ 2 ] = match[ 4 ] || match[ 5 ] || "";

    			// Strip excess characters from unquoted arguments
    			} else if ( unquoted && rpseudo.test( unquoted ) &&

    				// Get excess from tokenize (recursively)
    				( excess = tokenize( unquoted, true ) ) &&

    				// advance to the next closing parenthesis
    				( excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length ) ) {

    				// excess is a negative index
    				match[ 0 ] = match[ 0 ].slice( 0, excess );
    				match[ 2 ] = unquoted.slice( 0, excess );
    			}

    			// Return only captures needed by the pseudo filter method (type and argument)
    			return match.slice( 0, 3 );
    		}
    	},

    	filter: {

    		"TAG": function( nodeNameSelector ) {
    			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
    			return nodeNameSelector === "*" ?
    				function() {
    					return true;
    				} :
    				function( elem ) {
    					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
    				};
    		},

    		"CLASS": function( className ) {
    			var pattern = classCache[ className + " " ];

    			return pattern ||
    				( pattern = new RegExp( "(^|" + whitespace +
    					")" + className + "(" + whitespace + "|$)" ) ) && classCache(
    						className, function( elem ) {
    							return pattern.test(
    								typeof elem.className === "string" && elem.className ||
    								typeof elem.getAttribute !== "undefined" &&
    									elem.getAttribute( "class" ) ||
    								""
    							);
    				} );
    		},

    		"ATTR": function( name, operator, check ) {
    			return function( elem ) {
    				var result = Sizzle.attr( elem, name );

    				if ( result == null ) {
    					return operator === "!=";
    				}
    				if ( !operator ) {
    					return true;
    				}

    				result += "";

    				/* eslint-disable max-len */

    				return operator === "=" ? result === check :
    					operator === "!=" ? result !== check :
    					operator === "^=" ? check && result.indexOf( check ) === 0 :
    					operator === "*=" ? check && result.indexOf( check ) > -1 :
    					operator === "$=" ? check && result.slice( -check.length ) === check :
    					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
    					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
    					false;
    				/* eslint-enable max-len */

    			};
    		},

    		"CHILD": function( type, what, _argument, first, last ) {
    			var simple = type.slice( 0, 3 ) !== "nth",
    				forward = type.slice( -4 ) !== "last",
    				ofType = what === "of-type";

    			return first === 1 && last === 0 ?

    				// Shortcut for :nth-*(n)
    				function( elem ) {
    					return !!elem.parentNode;
    				} :

    				function( elem, _context, xml ) {
    					var cache, uniqueCache, outerCache, node, nodeIndex, start,
    						dir = simple !== forward ? "nextSibling" : "previousSibling",
    						parent = elem.parentNode,
    						name = ofType && elem.nodeName.toLowerCase(),
    						useCache = !xml && !ofType,
    						diff = false;

    					if ( parent ) {

    						// :(first|last|only)-(child|of-type)
    						if ( simple ) {
    							while ( dir ) {
    								node = elem;
    								while ( ( node = node[ dir ] ) ) {
    									if ( ofType ?
    										node.nodeName.toLowerCase() === name :
    										node.nodeType === 1 ) {

    										return false;
    									}
    								}

    								// Reverse direction for :only-* (if we haven't yet done so)
    								start = dir = type === "only" && !start && "nextSibling";
    							}
    							return true;
    						}

    						start = [ forward ? parent.firstChild : parent.lastChild ];

    						// non-xml :nth-child(...) stores cache data on `parent`
    						if ( forward && useCache ) {

    							// Seek `elem` from a previously-cached index

    							// ...in a gzip-friendly way
    							node = parent;
    							outerCache = node[ expando ] || ( node[ expando ] = {} );

    							// Support: IE <9 only
    							// Defend against cloned attroperties (jQuery gh-1709)
    							uniqueCache = outerCache[ node.uniqueID ] ||
    								( outerCache[ node.uniqueID ] = {} );

    							cache = uniqueCache[ type ] || [];
    							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
    							diff = nodeIndex && cache[ 2 ];
    							node = nodeIndex && parent.childNodes[ nodeIndex ];

    							while ( ( node = ++nodeIndex && node && node[ dir ] ||

    								// Fallback to seeking `elem` from the start
    								( diff = nodeIndex = 0 ) || start.pop() ) ) {

    								// When found, cache indexes on `parent` and break
    								if ( node.nodeType === 1 && ++diff && node === elem ) {
    									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
    									break;
    								}
    							}

    						} else {

    							// Use previously-cached element index if available
    							if ( useCache ) {

    								// ...in a gzip-friendly way
    								node = elem;
    								outerCache = node[ expando ] || ( node[ expando ] = {} );

    								// Support: IE <9 only
    								// Defend against cloned attroperties (jQuery gh-1709)
    								uniqueCache = outerCache[ node.uniqueID ] ||
    									( outerCache[ node.uniqueID ] = {} );

    								cache = uniqueCache[ type ] || [];
    								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
    								diff = nodeIndex;
    							}

    							// xml :nth-child(...)
    							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
    							if ( diff === false ) {

    								// Use the same loop as above to seek `elem` from the start
    								while ( ( node = ++nodeIndex && node && node[ dir ] ||
    									( diff = nodeIndex = 0 ) || start.pop() ) ) {

    									if ( ( ofType ?
    										node.nodeName.toLowerCase() === name :
    										node.nodeType === 1 ) &&
    										++diff ) {

    										// Cache the index of each encountered element
    										if ( useCache ) {
    											outerCache = node[ expando ] ||
    												( node[ expando ] = {} );

    											// Support: IE <9 only
    											// Defend against cloned attroperties (jQuery gh-1709)
    											uniqueCache = outerCache[ node.uniqueID ] ||
    												( outerCache[ node.uniqueID ] = {} );

    											uniqueCache[ type ] = [ dirruns, diff ];
    										}

    										if ( node === elem ) {
    											break;
    										}
    									}
    								}
    							}
    						}

    						// Incorporate the offset, then check against cycle size
    						diff -= last;
    						return diff === first || ( diff % first === 0 && diff / first >= 0 );
    					}
    				};
    		},

    		"PSEUDO": function( pseudo, argument ) {

    			// pseudo-class names are case-insensitive
    			// http://www.w3.org/TR/selectors/#pseudo-classes
    			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
    			// Remember that setFilters inherits from pseudos
    			var args,
    				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
    					Sizzle.error( "unsupported pseudo: " + pseudo );

    			// The user may use createPseudo to indicate that
    			// arguments are needed to create the filter function
    			// just as Sizzle does
    			if ( fn[ expando ] ) {
    				return fn( argument );
    			}

    			// But maintain support for old signatures
    			if ( fn.length > 1 ) {
    				args = [ pseudo, pseudo, "", argument ];
    				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
    					markFunction( function( seed, matches ) {
    						var idx,
    							matched = fn( seed, argument ),
    							i = matched.length;
    						while ( i-- ) {
    							idx = indexOf( seed, matched[ i ] );
    							seed[ idx ] = !( matches[ idx ] = matched[ i ] );
    						}
    					} ) :
    					function( elem ) {
    						return fn( elem, 0, args );
    					};
    			}

    			return fn;
    		}
    	},

    	pseudos: {

    		// Potentially complex pseudos
    		"not": markFunction( function( selector ) {

    			// Trim the selector passed to compile
    			// to avoid treating leading and trailing
    			// spaces as combinators
    			var input = [],
    				results = [],
    				matcher = compile( selector.replace( rtrim, "$1" ) );

    			return matcher[ expando ] ?
    				markFunction( function( seed, matches, _context, xml ) {
    					var elem,
    						unmatched = matcher( seed, null, xml, [] ),
    						i = seed.length;

    					// Match elements unmatched by `matcher`
    					while ( i-- ) {
    						if ( ( elem = unmatched[ i ] ) ) {
    							seed[ i ] = !( matches[ i ] = elem );
    						}
    					}
    				} ) :
    				function( elem, _context, xml ) {
    					input[ 0 ] = elem;
    					matcher( input, null, xml, results );

    					// Don't keep the element (issue #299)
    					input[ 0 ] = null;
    					return !results.pop();
    				};
    		} ),

    		"has": markFunction( function( selector ) {
    			return function( elem ) {
    				return Sizzle( selector, elem ).length > 0;
    			};
    		} ),

    		"contains": markFunction( function( text ) {
    			text = text.replace( runescape, funescape );
    			return function( elem ) {
    				return ( elem.textContent || getText( elem ) ).indexOf( text ) > -1;
    			};
    		} ),

    		// "Whether an element is represented by a :lang() selector
    		// is based solely on the element's language value
    		// being equal to the identifier C,
    		// or beginning with the identifier C immediately followed by "-".
    		// The matching of C against the element's language value is performed case-insensitively.
    		// The identifier C does not have to be a valid language name."
    		// http://www.w3.org/TR/selectors/#lang-pseudo
    		"lang": markFunction( function( lang ) {

    			// lang value must be a valid identifier
    			if ( !ridentifier.test( lang || "" ) ) {
    				Sizzle.error( "unsupported lang: " + lang );
    			}
    			lang = lang.replace( runescape, funescape ).toLowerCase();
    			return function( elem ) {
    				var elemLang;
    				do {
    					if ( ( elemLang = documentIsHTML ?
    						elem.lang :
    						elem.getAttribute( "xml:lang" ) || elem.getAttribute( "lang" ) ) ) {

    						elemLang = elemLang.toLowerCase();
    						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
    					}
    				} while ( ( elem = elem.parentNode ) && elem.nodeType === 1 );
    				return false;
    			};
    		} ),

    		// Miscellaneous
    		"target": function( elem ) {
    			var hash = window.location && window.location.hash;
    			return hash && hash.slice( 1 ) === elem.id;
    		},

    		"root": function( elem ) {
    			return elem === docElem;
    		},

    		"focus": function( elem ) {
    			return elem === document.activeElement &&
    				( !document.hasFocus || document.hasFocus() ) &&
    				!!( elem.type || elem.href || ~elem.tabIndex );
    		},

    		// Boolean properties
    		"enabled": createDisabledPseudo( false ),
    		"disabled": createDisabledPseudo( true ),

    		"checked": function( elem ) {

    			// In CSS3, :checked should return both checked and selected elements
    			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
    			var nodeName = elem.nodeName.toLowerCase();
    			return ( nodeName === "input" && !!elem.checked ) ||
    				( nodeName === "option" && !!elem.selected );
    		},

    		"selected": function( elem ) {

    			// Accessing this property makes selected-by-default
    			// options in Safari work properly
    			if ( elem.parentNode ) {
    				// eslint-disable-next-line no-unused-expressions
    				elem.parentNode.selectedIndex;
    			}

    			return elem.selected === true;
    		},

    		// Contents
    		"empty": function( elem ) {

    			// http://www.w3.org/TR/selectors/#empty-pseudo
    			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
    			//   but not by others (comment: 8; processing instruction: 7; etc.)
    			// nodeType < 6 works because attributes (2) do not appear as children
    			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
    				if ( elem.nodeType < 6 ) {
    					return false;
    				}
    			}
    			return true;
    		},

    		"parent": function( elem ) {
    			return !Expr.pseudos[ "empty" ]( elem );
    		},

    		// Element/input types
    		"header": function( elem ) {
    			return rheader.test( elem.nodeName );
    		},

    		"input": function( elem ) {
    			return rinputs.test( elem.nodeName );
    		},

    		"button": function( elem ) {
    			var name = elem.nodeName.toLowerCase();
    			return name === "input" && elem.type === "button" || name === "button";
    		},

    		"text": function( elem ) {
    			var attr;
    			return elem.nodeName.toLowerCase() === "input" &&
    				elem.type === "text" &&

    				// Support: IE<8
    				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
    				( ( attr = elem.getAttribute( "type" ) ) == null ||
    					attr.toLowerCase() === "text" );
    		},

    		// Position-in-collection
    		"first": createPositionalPseudo( function() {
    			return [ 0 ];
    		} ),

    		"last": createPositionalPseudo( function( _matchIndexes, length ) {
    			return [ length - 1 ];
    		} ),

    		"eq": createPositionalPseudo( function( _matchIndexes, length, argument ) {
    			return [ argument < 0 ? argument + length : argument ];
    		} ),

    		"even": createPositionalPseudo( function( matchIndexes, length ) {
    			var i = 0;
    			for ( ; i < length; i += 2 ) {
    				matchIndexes.push( i );
    			}
    			return matchIndexes;
    		} ),

    		"odd": createPositionalPseudo( function( matchIndexes, length ) {
    			var i = 1;
    			for ( ; i < length; i += 2 ) {
    				matchIndexes.push( i );
    			}
    			return matchIndexes;
    		} ),

    		"lt": createPositionalPseudo( function( matchIndexes, length, argument ) {
    			var i = argument < 0 ?
    				argument + length :
    				argument > length ?
    					length :
    					argument;
    			for ( ; --i >= 0; ) {
    				matchIndexes.push( i );
    			}
    			return matchIndexes;
    		} ),

    		"gt": createPositionalPseudo( function( matchIndexes, length, argument ) {
    			var i = argument < 0 ? argument + length : argument;
    			for ( ; ++i < length; ) {
    				matchIndexes.push( i );
    			}
    			return matchIndexes;
    		} )
    	}
    };

    Expr.pseudos[ "nth" ] = Expr.pseudos[ "eq" ];

    // Add button/input type pseudos
    for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
    	Expr.pseudos[ i ] = createInputPseudo( i );
    }
    for ( i in { submit: true, reset: true } ) {
    	Expr.pseudos[ i ] = createButtonPseudo( i );
    }

    // Easy API for creating new setFilters
    function setFilters() {}
    setFilters.prototype = Expr.filters = Expr.pseudos;
    Expr.setFilters = new setFilters();

    tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
    	var matched, match, tokens, type,
    		soFar, groups, preFilters,
    		cached = tokenCache[ selector + " " ];

    	if ( cached ) {
    		return parseOnly ? 0 : cached.slice( 0 );
    	}

    	soFar = selector;
    	groups = [];
    	preFilters = Expr.preFilter;

    	while ( soFar ) {

    		// Comma and first run
    		if ( !matched || ( match = rcomma.exec( soFar ) ) ) {
    			if ( match ) {

    				// Don't consume trailing commas as valid
    				soFar = soFar.slice( match[ 0 ].length ) || soFar;
    			}
    			groups.push( ( tokens = [] ) );
    		}

    		matched = false;

    		// Combinators
    		if ( ( match = rcombinators.exec( soFar ) ) ) {
    			matched = match.shift();
    			tokens.push( {
    				value: matched,

    				// Cast descendant combinators to space
    				type: match[ 0 ].replace( rtrim, " " )
    			} );
    			soFar = soFar.slice( matched.length );
    		}

    		// Filters
    		for ( type in Expr.filter ) {
    			if ( ( match = matchExpr[ type ].exec( soFar ) ) && ( !preFilters[ type ] ||
    				( match = preFilters[ type ]( match ) ) ) ) {
    				matched = match.shift();
    				tokens.push( {
    					value: matched,
    					type: type,
    					matches: match
    				} );
    				soFar = soFar.slice( matched.length );
    			}
    		}

    		if ( !matched ) {
    			break;
    		}
    	}

    	// Return the length of the invalid excess
    	// if we're just parsing
    	// Otherwise, throw an error or return tokens
    	return parseOnly ?
    		soFar.length :
    		soFar ?
    			Sizzle.error( selector ) :

    			// Cache the tokens
    			tokenCache( selector, groups ).slice( 0 );
    };

    function toSelector( tokens ) {
    	var i = 0,
    		len = tokens.length,
    		selector = "";
    	for ( ; i < len; i++ ) {
    		selector += tokens[ i ].value;
    	}
    	return selector;
    }

    function addCombinator( matcher, combinator, base ) {
    	var dir = combinator.dir,
    		skip = combinator.next,
    		key = skip || dir,
    		checkNonElements = base && key === "parentNode",
    		doneName = done++;

    	return combinator.first ?

    		// Check against closest ancestor/preceding element
    		function( elem, context, xml ) {
    			while ( ( elem = elem[ dir ] ) ) {
    				if ( elem.nodeType === 1 || checkNonElements ) {
    					return matcher( elem, context, xml );
    				}
    			}
    			return false;
    		} :

    		// Check against all ancestor/preceding elements
    		function( elem, context, xml ) {
    			var oldCache, uniqueCache, outerCache,
    				newCache = [ dirruns, doneName ];

    			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
    			if ( xml ) {
    				while ( ( elem = elem[ dir ] ) ) {
    					if ( elem.nodeType === 1 || checkNonElements ) {
    						if ( matcher( elem, context, xml ) ) {
    							return true;
    						}
    					}
    				}
    			} else {
    				while ( ( elem = elem[ dir ] ) ) {
    					if ( elem.nodeType === 1 || checkNonElements ) {
    						outerCache = elem[ expando ] || ( elem[ expando ] = {} );

    						// Support: IE <9 only
    						// Defend against cloned attroperties (jQuery gh-1709)
    						uniqueCache = outerCache[ elem.uniqueID ] ||
    							( outerCache[ elem.uniqueID ] = {} );

    						if ( skip && skip === elem.nodeName.toLowerCase() ) {
    							elem = elem[ dir ] || elem;
    						} else if ( ( oldCache = uniqueCache[ key ] ) &&
    							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

    							// Assign to newCache so results back-propagate to previous elements
    							return ( newCache[ 2 ] = oldCache[ 2 ] );
    						} else {

    							// Reuse newcache so results back-propagate to previous elements
    							uniqueCache[ key ] = newCache;

    							// A match means we're done; a fail means we have to keep checking
    							if ( ( newCache[ 2 ] = matcher( elem, context, xml ) ) ) {
    								return true;
    							}
    						}
    					}
    				}
    			}
    			return false;
    		};
    }

    function elementMatcher( matchers ) {
    	return matchers.length > 1 ?
    		function( elem, context, xml ) {
    			var i = matchers.length;
    			while ( i-- ) {
    				if ( !matchers[ i ]( elem, context, xml ) ) {
    					return false;
    				}
    			}
    			return true;
    		} :
    		matchers[ 0 ];
    }

    function multipleContexts( selector, contexts, results ) {
    	var i = 0,
    		len = contexts.length;
    	for ( ; i < len; i++ ) {
    		Sizzle( selector, contexts[ i ], results );
    	}
    	return results;
    }

    function condense( unmatched, map, filter, context, xml ) {
    	var elem,
    		newUnmatched = [],
    		i = 0,
    		len = unmatched.length,
    		mapped = map != null;

    	for ( ; i < len; i++ ) {
    		if ( ( elem = unmatched[ i ] ) ) {
    			if ( !filter || filter( elem, context, xml ) ) {
    				newUnmatched.push( elem );
    				if ( mapped ) {
    					map.push( i );
    				}
    			}
    		}
    	}

    	return newUnmatched;
    }

    function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
    	if ( postFilter && !postFilter[ expando ] ) {
    		postFilter = setMatcher( postFilter );
    	}
    	if ( postFinder && !postFinder[ expando ] ) {
    		postFinder = setMatcher( postFinder, postSelector );
    	}
    	return markFunction( function( seed, results, context, xml ) {
    		var temp, i, elem,
    			preMap = [],
    			postMap = [],
    			preexisting = results.length,

    			// Get initial elements from seed or context
    			elems = seed || multipleContexts(
    				selector || "*",
    				context.nodeType ? [ context ] : context,
    				[]
    			),

    			// Prefilter to get matcher input, preserving a map for seed-results synchronization
    			matcherIn = preFilter && ( seed || !selector ) ?
    				condense( elems, preMap, preFilter, context, xml ) :
    				elems,

    			matcherOut = matcher ?

    				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
    				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

    					// ...intermediate processing is necessary
    					[] :

    					// ...otherwise use results directly
    					results :
    				matcherIn;

    		// Find primary matches
    		if ( matcher ) {
    			matcher( matcherIn, matcherOut, context, xml );
    		}

    		// Apply postFilter
    		if ( postFilter ) {
    			temp = condense( matcherOut, postMap );
    			postFilter( temp, [], context, xml );

    			// Un-match failing elements by moving them back to matcherIn
    			i = temp.length;
    			while ( i-- ) {
    				if ( ( elem = temp[ i ] ) ) {
    					matcherOut[ postMap[ i ] ] = !( matcherIn[ postMap[ i ] ] = elem );
    				}
    			}
    		}

    		if ( seed ) {
    			if ( postFinder || preFilter ) {
    				if ( postFinder ) {

    					// Get the final matcherOut by condensing this intermediate into postFinder contexts
    					temp = [];
    					i = matcherOut.length;
    					while ( i-- ) {
    						if ( ( elem = matcherOut[ i ] ) ) {

    							// Restore matcherIn since elem is not yet a final match
    							temp.push( ( matcherIn[ i ] = elem ) );
    						}
    					}
    					postFinder( null, ( matcherOut = [] ), temp, xml );
    				}

    				// Move matched elements from seed to results to keep them synchronized
    				i = matcherOut.length;
    				while ( i-- ) {
    					if ( ( elem = matcherOut[ i ] ) &&
    						( temp = postFinder ? indexOf( seed, elem ) : preMap[ i ] ) > -1 ) {

    						seed[ temp ] = !( results[ temp ] = elem );
    					}
    				}
    			}

    		// Add elements to results, through postFinder if defined
    		} else {
    			matcherOut = condense(
    				matcherOut === results ?
    					matcherOut.splice( preexisting, matcherOut.length ) :
    					matcherOut
    			);
    			if ( postFinder ) {
    				postFinder( null, results, matcherOut, xml );
    			} else {
    				push.apply( results, matcherOut );
    			}
    		}
    	} );
    }

    function matcherFromTokens( tokens ) {
    	var checkContext, matcher, j,
    		len = tokens.length,
    		leadingRelative = Expr.relative[ tokens[ 0 ].type ],
    		implicitRelative = leadingRelative || Expr.relative[ " " ],
    		i = leadingRelative ? 1 : 0,

    		// The foundational matcher ensures that elements are reachable from top-level context(s)
    		matchContext = addCombinator( function( elem ) {
    			return elem === checkContext;
    		}, implicitRelative, true ),
    		matchAnyContext = addCombinator( function( elem ) {
    			return indexOf( checkContext, elem ) > -1;
    		}, implicitRelative, true ),
    		matchers = [ function( elem, context, xml ) {
    			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
    				( checkContext = context ).nodeType ?
    					matchContext( elem, context, xml ) :
    					matchAnyContext( elem, context, xml ) );

    			// Avoid hanging onto element (issue #299)
    			checkContext = null;
    			return ret;
    		} ];

    	for ( ; i < len; i++ ) {
    		if ( ( matcher = Expr.relative[ tokens[ i ].type ] ) ) {
    			matchers = [ addCombinator( elementMatcher( matchers ), matcher ) ];
    		} else {
    			matcher = Expr.filter[ tokens[ i ].type ].apply( null, tokens[ i ].matches );

    			// Return special upon seeing a positional matcher
    			if ( matcher[ expando ] ) {

    				// Find the next relative operator (if any) for proper handling
    				j = ++i;
    				for ( ; j < len; j++ ) {
    					if ( Expr.relative[ tokens[ j ].type ] ) {
    						break;
    					}
    				}
    				return setMatcher(
    					i > 1 && elementMatcher( matchers ),
    					i > 1 && toSelector(

    					// If the preceding token was a descendant combinator, insert an implicit any-element `*`
    					tokens
    						.slice( 0, i - 1 )
    						.concat( { value: tokens[ i - 2 ].type === " " ? "*" : "" } )
    					).replace( rtrim, "$1" ),
    					matcher,
    					i < j && matcherFromTokens( tokens.slice( i, j ) ),
    					j < len && matcherFromTokens( ( tokens = tokens.slice( j ) ) ),
    					j < len && toSelector( tokens )
    				);
    			}
    			matchers.push( matcher );
    		}
    	}

    	return elementMatcher( matchers );
    }

    function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
    	var bySet = setMatchers.length > 0,
    		byElement = elementMatchers.length > 0,
    		superMatcher = function( seed, context, xml, results, outermost ) {
    			var elem, j, matcher,
    				matchedCount = 0,
    				i = "0",
    				unmatched = seed && [],
    				setMatched = [],
    				contextBackup = outermostContext,

    				// We must always have either seed elements or outermost context
    				elems = seed || byElement && Expr.find[ "TAG" ]( "*", outermost ),

    				// Use integer dirruns iff this is the outermost matcher
    				dirrunsUnique = ( dirruns += contextBackup == null ? 1 : Math.random() || 0.1 ),
    				len = elems.length;

    			if ( outermost ) {

    				// Support: IE 11+, Edge 17 - 18+
    				// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    				// two documents; shallow comparisons work.
    				// eslint-disable-next-line eqeqeq
    				outermostContext = context == document || context || outermost;
    			}

    			// Add elements passing elementMatchers directly to results
    			// Support: IE<9, Safari
    			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
    			for ( ; i !== len && ( elem = elems[ i ] ) != null; i++ ) {
    				if ( byElement && elem ) {
    					j = 0;

    					// Support: IE 11+, Edge 17 - 18+
    					// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
    					// two documents; shallow comparisons work.
    					// eslint-disable-next-line eqeqeq
    					if ( !context && elem.ownerDocument != document ) {
    						setDocument( elem );
    						xml = !documentIsHTML;
    					}
    					while ( ( matcher = elementMatchers[ j++ ] ) ) {
    						if ( matcher( elem, context || document, xml ) ) {
    							results.push( elem );
    							break;
    						}
    					}
    					if ( outermost ) {
    						dirruns = dirrunsUnique;
    					}
    				}

    				// Track unmatched elements for set filters
    				if ( bySet ) {

    					// They will have gone through all possible matchers
    					if ( ( elem = !matcher && elem ) ) {
    						matchedCount--;
    					}

    					// Lengthen the array for every element, matched or not
    					if ( seed ) {
    						unmatched.push( elem );
    					}
    				}
    			}

    			// `i` is now the count of elements visited above, and adding it to `matchedCount`
    			// makes the latter nonnegative.
    			matchedCount += i;

    			// Apply set filters to unmatched elements
    			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
    			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
    			// no element matchers and no seed.
    			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
    			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
    			// numerically zero.
    			if ( bySet && i !== matchedCount ) {
    				j = 0;
    				while ( ( matcher = setMatchers[ j++ ] ) ) {
    					matcher( unmatched, setMatched, context, xml );
    				}

    				if ( seed ) {

    					// Reintegrate element matches to eliminate the need for sorting
    					if ( matchedCount > 0 ) {
    						while ( i-- ) {
    							if ( !( unmatched[ i ] || setMatched[ i ] ) ) {
    								setMatched[ i ] = pop.call( results );
    							}
    						}
    					}

    					// Discard index placeholder values to get only actual matches
    					setMatched = condense( setMatched );
    				}

    				// Add matches to results
    				push.apply( results, setMatched );

    				// Seedless set matches succeeding multiple successful matchers stipulate sorting
    				if ( outermost && !seed && setMatched.length > 0 &&
    					( matchedCount + setMatchers.length ) > 1 ) {

    					Sizzle.uniqueSort( results );
    				}
    			}

    			// Override manipulation of globals by nested matchers
    			if ( outermost ) {
    				dirruns = dirrunsUnique;
    				outermostContext = contextBackup;
    			}

    			return unmatched;
    		};

    	return bySet ?
    		markFunction( superMatcher ) :
    		superMatcher;
    }

    compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
    	var i,
    		setMatchers = [],
    		elementMatchers = [],
    		cached = compilerCache[ selector + " " ];

    	if ( !cached ) {

    		// Generate a function of recursive functions that can be used to check each element
    		if ( !match ) {
    			match = tokenize( selector );
    		}
    		i = match.length;
    		while ( i-- ) {
    			cached = matcherFromTokens( match[ i ] );
    			if ( cached[ expando ] ) {
    				setMatchers.push( cached );
    			} else {
    				elementMatchers.push( cached );
    			}
    		}

    		// Cache the compiled function
    		cached = compilerCache(
    			selector,
    			matcherFromGroupMatchers( elementMatchers, setMatchers )
    		);

    		// Save selector and tokenization
    		cached.selector = selector;
    	}
    	return cached;
    };

    /**
     * A low-level selection function that works with Sizzle's compiled
     *  selector functions
     * @param {String|Function} selector A selector or a pre-compiled
     *  selector function built with Sizzle.compile
     * @param {Element} context
     * @param {Array} [results]
     * @param {Array} [seed] A set of elements to match against
     */
    select = Sizzle.select = function( selector, context, results, seed ) {
    	var i, tokens, token, type, find,
    		compiled = typeof selector === "function" && selector,
    		match = !seed && tokenize( ( selector = compiled.selector || selector ) );

    	results = results || [];

    	// Try to minimize operations if there is only one selector in the list and no seed
    	// (the latter of which guarantees us context)
    	if ( match.length === 1 ) {

    		// Reduce context if the leading compound selector is an ID
    		tokens = match[ 0 ] = match[ 0 ].slice( 0 );
    		if ( tokens.length > 2 && ( token = tokens[ 0 ] ).type === "ID" &&
    			context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[ 1 ].type ] ) {

    			context = ( Expr.find[ "ID" ]( token.matches[ 0 ]
    				.replace( runescape, funescape ), context ) || [] )[ 0 ];
    			if ( !context ) {
    				return results;

    			// Precompiled matchers will still verify ancestry, so step up a level
    			} else if ( compiled ) {
    				context = context.parentNode;
    			}

    			selector = selector.slice( tokens.shift().value.length );
    		}

    		// Fetch a seed set for right-to-left matching
    		i = matchExpr[ "needsContext" ].test( selector ) ? 0 : tokens.length;
    		while ( i-- ) {
    			token = tokens[ i ];

    			// Abort if we hit a combinator
    			if ( Expr.relative[ ( type = token.type ) ] ) {
    				break;
    			}
    			if ( ( find = Expr.find[ type ] ) ) {

    				// Search, expanding context for leading sibling combinators
    				if ( ( seed = find(
    					token.matches[ 0 ].replace( runescape, funescape ),
    					rsibling.test( tokens[ 0 ].type ) && testContext( context.parentNode ) ||
    						context
    				) ) ) {

    					// If seed is empty or no tokens remain, we can return early
    					tokens.splice( i, 1 );
    					selector = seed.length && toSelector( tokens );
    					if ( !selector ) {
    						push.apply( results, seed );
    						return results;
    					}

    					break;
    				}
    			}
    		}
    	}

    	// Compile and execute a filtering function if one is not provided
    	// Provide `match` to avoid retokenization if we modified the selector above
    	( compiled || compile( selector, match ) )(
    		seed,
    		context,
    		!documentIsHTML,
    		results,
    		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
    	);
    	return results;
    };

    // One-time assignments

    // Sort stability
    support.sortStable = expando.split( "" ).sort( sortOrder ).join( "" ) === expando;

    // Support: Chrome 14-35+
    // Always assume duplicates if they aren't passed to the comparison function
    support.detectDuplicates = !!hasDuplicate;

    // Initialize against the default document
    setDocument();

    // Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
    // Detached nodes confoundingly follow *each other*
    support.sortDetached = assert( function( el ) {

    	// Should return 1, but returns 4 (following)
    	return el.compareDocumentPosition( document.createElement( "fieldset" ) ) & 1;
    } );

    // Support: IE<8
    // Prevent attribute/property "interpolation"
    // https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
    if ( !assert( function( el ) {
    	el.innerHTML = "<a href='#'></a>";
    	return el.firstChild.getAttribute( "href" ) === "#";
    } ) ) {
    	addHandle( "type|href|height|width", function( elem, name, isXML ) {
    		if ( !isXML ) {
    			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
    		}
    	} );
    }

    // Support: IE<9
    // Use defaultValue in place of getAttribute("value")
    if ( !support.attributes || !assert( function( el ) {
    	el.innerHTML = "<input/>";
    	el.firstChild.setAttribute( "value", "" );
    	return el.firstChild.getAttribute( "value" ) === "";
    } ) ) {
    	addHandle( "value", function( elem, _name, isXML ) {
    		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
    			return elem.defaultValue;
    		}
    	} );
    }

    // Support: IE<9
    // Use getAttributeNode to fetch booleans when getAttribute lies
    if ( !assert( function( el ) {
    	return el.getAttribute( "disabled" ) == null;
    } ) ) {
    	addHandle( booleans, function( elem, name, isXML ) {
    		var val;
    		if ( !isXML ) {
    			return elem[ name ] === true ? name.toLowerCase() :
    				( val = elem.getAttributeNode( name ) ) && val.specified ?
    					val.value :
    					null;
    		}
    	} );
    }

    return Sizzle;

    } )( window );



    jQuery.find = Sizzle;
    jQuery.expr = Sizzle.selectors;

    // Deprecated
    jQuery.expr[ ":" ] = jQuery.expr.pseudos;
    jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
    jQuery.text = Sizzle.getText;
    jQuery.isXMLDoc = Sizzle.isXML;
    jQuery.contains = Sizzle.contains;
    jQuery.escapeSelector = Sizzle.escape;




    var dir = function( elem, dir, until ) {
    	var matched = [],
    		truncate = until !== undefined;

    	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
    		if ( elem.nodeType === 1 ) {
    			if ( truncate && jQuery( elem ).is( until ) ) {
    				break;
    			}
    			matched.push( elem );
    		}
    	}
    	return matched;
    };


    var siblings = function( n, elem ) {
    	var matched = [];

    	for ( ; n; n = n.nextSibling ) {
    		if ( n.nodeType === 1 && n !== elem ) {
    			matched.push( n );
    		}
    	}

    	return matched;
    };


    var rneedsContext = jQuery.expr.match.needsContext;



    function nodeName( elem, name ) {

    	return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

    }
    var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



    // Implement the identical functionality for filter and not
    function winnow( elements, qualifier, not ) {
    	if ( isFunction( qualifier ) ) {
    		return jQuery.grep( elements, function( elem, i ) {
    			return !!qualifier.call( elem, i, elem ) !== not;
    		} );
    	}

    	// Single element
    	if ( qualifier.nodeType ) {
    		return jQuery.grep( elements, function( elem ) {
    			return ( elem === qualifier ) !== not;
    		} );
    	}

    	// Arraylike of elements (jQuery, arguments, Array)
    	if ( typeof qualifier !== "string" ) {
    		return jQuery.grep( elements, function( elem ) {
    			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
    		} );
    	}

    	// Filtered directly for both simple and complex selectors
    	return jQuery.filter( qualifier, elements, not );
    }

    jQuery.filter = function( expr, elems, not ) {
    	var elem = elems[ 0 ];

    	if ( not ) {
    		expr = ":not(" + expr + ")";
    	}

    	if ( elems.length === 1 && elem.nodeType === 1 ) {
    		return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
    	}

    	return jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
    		return elem.nodeType === 1;
    	} ) );
    };

    jQuery.fn.extend( {
    	find: function( selector ) {
    		var i, ret,
    			len = this.length,
    			self = this;

    		if ( typeof selector !== "string" ) {
    			return this.pushStack( jQuery( selector ).filter( function() {
    				for ( i = 0; i < len; i++ ) {
    					if ( jQuery.contains( self[ i ], this ) ) {
    						return true;
    					}
    				}
    			} ) );
    		}

    		ret = this.pushStack( [] );

    		for ( i = 0; i < len; i++ ) {
    			jQuery.find( selector, self[ i ], ret );
    		}

    		return len > 1 ? jQuery.uniqueSort( ret ) : ret;
    	},
    	filter: function( selector ) {
    		return this.pushStack( winnow( this, selector || [], false ) );
    	},
    	not: function( selector ) {
    		return this.pushStack( winnow( this, selector || [], true ) );
    	},
    	is: function( selector ) {
    		return !!winnow(
    			this,

    			// If this is a positional/relative selector, check membership in the returned set
    			// so $("p:first").is("p:last") won't return true for a doc with two "p".
    			typeof selector === "string" && rneedsContext.test( selector ) ?
    				jQuery( selector ) :
    				selector || [],
    			false
    		).length;
    	}
    } );


    // Initialize a jQuery object


    // A central reference to the root jQuery(document)
    var rootjQuery,

    	// A simple way to check for HTML strings
    	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
    	// Strict HTML recognition (#11290: must start with <)
    	// Shortcut simple #id case for speed
    	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

    	init = jQuery.fn.init = function( selector, context, root ) {
    		var match, elem;

    		// HANDLE: $(""), $(null), $(undefined), $(false)
    		if ( !selector ) {
    			return this;
    		}

    		// Method init() accepts an alternate rootjQuery
    		// so migrate can support jQuery.sub (gh-2101)
    		root = root || rootjQuery;

    		// Handle HTML strings
    		if ( typeof selector === "string" ) {
    			if ( selector[ 0 ] === "<" &&
    				selector[ selector.length - 1 ] === ">" &&
    				selector.length >= 3 ) {

    				// Assume that strings that start and end with <> are HTML and skip the regex check
    				match = [ null, selector, null ];

    			} else {
    				match = rquickExpr.exec( selector );
    			}

    			// Match html or make sure no context is specified for #id
    			if ( match && ( match[ 1 ] || !context ) ) {

    				// HANDLE: $(html) -> $(array)
    				if ( match[ 1 ] ) {
    					context = context instanceof jQuery ? context[ 0 ] : context;

    					// Option to run scripts is true for back-compat
    					// Intentionally let the error be thrown if parseHTML is not present
    					jQuery.merge( this, jQuery.parseHTML(
    						match[ 1 ],
    						context && context.nodeType ? context.ownerDocument || context : document,
    						true
    					) );

    					// HANDLE: $(html, props)
    					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
    						for ( match in context ) {

    							// Properties of context are called as methods if possible
    							if ( isFunction( this[ match ] ) ) {
    								this[ match ]( context[ match ] );

    							// ...and otherwise set as attributes
    							} else {
    								this.attr( match, context[ match ] );
    							}
    						}
    					}

    					return this;

    				// HANDLE: $(#id)
    				} else {
    					elem = document.getElementById( match[ 2 ] );

    					if ( elem ) {

    						// Inject the element directly into the jQuery object
    						this[ 0 ] = elem;
    						this.length = 1;
    					}
    					return this;
    				}

    			// HANDLE: $(expr, $(...))
    			} else if ( !context || context.jquery ) {
    				return ( context || root ).find( selector );

    			// HANDLE: $(expr, context)
    			// (which is just equivalent to: $(context).find(expr)
    			} else {
    				return this.constructor( context ).find( selector );
    			}

    		// HANDLE: $(DOMElement)
    		} else if ( selector.nodeType ) {
    			this[ 0 ] = selector;
    			this.length = 1;
    			return this;

    		// HANDLE: $(function)
    		// Shortcut for document ready
    		} else if ( isFunction( selector ) ) {
    			return root.ready !== undefined ?
    				root.ready( selector ) :

    				// Execute immediately if ready is not present
    				selector( jQuery );
    		}

    		return jQuery.makeArray( selector, this );
    	};

    // Give the init function the jQuery prototype for later instantiation
    init.prototype = jQuery.fn;

    // Initialize central reference
    rootjQuery = jQuery( document );


    var rparentsprev = /^(?:parents|prev(?:Until|All))/,

    	// Methods guaranteed to produce a unique set when starting from a unique set
    	guaranteedUnique = {
    		children: true,
    		contents: true,
    		next: true,
    		prev: true
    	};

    jQuery.fn.extend( {
    	has: function( target ) {
    		var targets = jQuery( target, this ),
    			l = targets.length;

    		return this.filter( function() {
    			var i = 0;
    			for ( ; i < l; i++ ) {
    				if ( jQuery.contains( this, targets[ i ] ) ) {
    					return true;
    				}
    			}
    		} );
    	},

    	closest: function( selectors, context ) {
    		var cur,
    			i = 0,
    			l = this.length,
    			matched = [],
    			targets = typeof selectors !== "string" && jQuery( selectors );

    		// Positional selectors never match, since there's no _selection_ context
    		if ( !rneedsContext.test( selectors ) ) {
    			for ( ; i < l; i++ ) {
    				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

    					// Always skip document fragments
    					if ( cur.nodeType < 11 && ( targets ?
    						targets.index( cur ) > -1 :

    						// Don't pass non-elements to Sizzle
    						cur.nodeType === 1 &&
    							jQuery.find.matchesSelector( cur, selectors ) ) ) {

    						matched.push( cur );
    						break;
    					}
    				}
    			}
    		}

    		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
    	},

    	// Determine the position of an element within the set
    	index: function( elem ) {

    		// No argument, return index in parent
    		if ( !elem ) {
    			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
    		}

    		// Index in selector
    		if ( typeof elem === "string" ) {
    			return indexOf.call( jQuery( elem ), this[ 0 ] );
    		}

    		// Locate the position of the desired element
    		return indexOf.call( this,

    			// If it receives a jQuery object, the first element is used
    			elem.jquery ? elem[ 0 ] : elem
    		);
    	},

    	add: function( selector, context ) {
    		return this.pushStack(
    			jQuery.uniqueSort(
    				jQuery.merge( this.get(), jQuery( selector, context ) )
    			)
    		);
    	},

    	addBack: function( selector ) {
    		return this.add( selector == null ?
    			this.prevObject : this.prevObject.filter( selector )
    		);
    	}
    } );

    function sibling( cur, dir ) {
    	while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
    	return cur;
    }

    jQuery.each( {
    	parent: function( elem ) {
    		var parent = elem.parentNode;
    		return parent && parent.nodeType !== 11 ? parent : null;
    	},
    	parents: function( elem ) {
    		return dir( elem, "parentNode" );
    	},
    	parentsUntil: function( elem, _i, until ) {
    		return dir( elem, "parentNode", until );
    	},
    	next: function( elem ) {
    		return sibling( elem, "nextSibling" );
    	},
    	prev: function( elem ) {
    		return sibling( elem, "previousSibling" );
    	},
    	nextAll: function( elem ) {
    		return dir( elem, "nextSibling" );
    	},
    	prevAll: function( elem ) {
    		return dir( elem, "previousSibling" );
    	},
    	nextUntil: function( elem, _i, until ) {
    		return dir( elem, "nextSibling", until );
    	},
    	prevUntil: function( elem, _i, until ) {
    		return dir( elem, "previousSibling", until );
    	},
    	siblings: function( elem ) {
    		return siblings( ( elem.parentNode || {} ).firstChild, elem );
    	},
    	children: function( elem ) {
    		return siblings( elem.firstChild );
    	},
    	contents: function( elem ) {
    		if ( elem.contentDocument != null &&

    			// Support: IE 11+
    			// <object> elements with no `data` attribute has an object
    			// `contentDocument` with a `null` prototype.
    			getProto( elem.contentDocument ) ) {

    			return elem.contentDocument;
    		}

    		// Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
    		// Treat the template element as a regular one in browsers that
    		// don't support it.
    		if ( nodeName( elem, "template" ) ) {
    			elem = elem.content || elem;
    		}

    		return jQuery.merge( [], elem.childNodes );
    	}
    }, function( name, fn ) {
    	jQuery.fn[ name ] = function( until, selector ) {
    		var matched = jQuery.map( this, fn, until );

    		if ( name.slice( -5 ) !== "Until" ) {
    			selector = until;
    		}

    		if ( selector && typeof selector === "string" ) {
    			matched = jQuery.filter( selector, matched );
    		}

    		if ( this.length > 1 ) {

    			// Remove duplicates
    			if ( !guaranteedUnique[ name ] ) {
    				jQuery.uniqueSort( matched );
    			}

    			// Reverse order for parents* and prev-derivatives
    			if ( rparentsprev.test( name ) ) {
    				matched.reverse();
    			}
    		}

    		return this.pushStack( matched );
    	};
    } );
    var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



    // Convert String-formatted options into Object-formatted ones
    function createOptions( options ) {
    	var object = {};
    	jQuery.each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
    		object[ flag ] = true;
    	} );
    	return object;
    }

    /*
     * Create a callback list using the following parameters:
     *
     *	options: an optional list of space-separated options that will change how
     *			the callback list behaves or a more traditional option object
     *
     * By default a callback list will act like an event callback list and can be
     * "fired" multiple times.
     *
     * Possible options:
     *
     *	once:			will ensure the callback list can only be fired once (like a Deferred)
     *
     *	memory:			will keep track of previous values and will call any callback added
     *					after the list has been fired right away with the latest "memorized"
     *					values (like a Deferred)
     *
     *	unique:			will ensure a callback can only be added once (no duplicate in the list)
     *
     *	stopOnFalse:	interrupt callings when a callback returns false
     *
     */
    jQuery.Callbacks = function( options ) {

    	// Convert options from String-formatted to Object-formatted if needed
    	// (we check in cache first)
    	options = typeof options === "string" ?
    		createOptions( options ) :
    		jQuery.extend( {}, options );

    	var // Flag to know if list is currently firing
    		firing,

    		// Last fire value for non-forgettable lists
    		memory,

    		// Flag to know if list was already fired
    		fired,

    		// Flag to prevent firing
    		locked,

    		// Actual callback list
    		list = [],

    		// Queue of execution data for repeatable lists
    		queue = [],

    		// Index of currently firing callback (modified by add/remove as needed)
    		firingIndex = -1,

    		// Fire callbacks
    		fire = function() {

    			// Enforce single-firing
    			locked = locked || options.once;

    			// Execute callbacks for all pending executions,
    			// respecting firingIndex overrides and runtime changes
    			fired = firing = true;
    			for ( ; queue.length; firingIndex = -1 ) {
    				memory = queue.shift();
    				while ( ++firingIndex < list.length ) {

    					// Run callback and check for early termination
    					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
    						options.stopOnFalse ) {

    						// Jump to end and forget the data so .add doesn't re-fire
    						firingIndex = list.length;
    						memory = false;
    					}
    				}
    			}

    			// Forget the data if we're done with it
    			if ( !options.memory ) {
    				memory = false;
    			}

    			firing = false;

    			// Clean up if we're done firing for good
    			if ( locked ) {

    				// Keep an empty list if we have data for future add calls
    				if ( memory ) {
    					list = [];

    				// Otherwise, this object is spent
    				} else {
    					list = "";
    				}
    			}
    		},

    		// Actual Callbacks object
    		self = {

    			// Add a callback or a collection of callbacks to the list
    			add: function() {
    				if ( list ) {

    					// If we have memory from a past run, we should fire after adding
    					if ( memory && !firing ) {
    						firingIndex = list.length - 1;
    						queue.push( memory );
    					}

    					( function add( args ) {
    						jQuery.each( args, function( _, arg ) {
    							if ( isFunction( arg ) ) {
    								if ( !options.unique || !self.has( arg ) ) {
    									list.push( arg );
    								}
    							} else if ( arg && arg.length && toType( arg ) !== "string" ) {

    								// Inspect recursively
    								add( arg );
    							}
    						} );
    					} )( arguments );

    					if ( memory && !firing ) {
    						fire();
    					}
    				}
    				return this;
    			},

    			// Remove a callback from the list
    			remove: function() {
    				jQuery.each( arguments, function( _, arg ) {
    					var index;
    					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
    						list.splice( index, 1 );

    						// Handle firing indexes
    						if ( index <= firingIndex ) {
    							firingIndex--;
    						}
    					}
    				} );
    				return this;
    			},

    			// Check if a given callback is in the list.
    			// If no argument is given, return whether or not list has callbacks attached.
    			has: function( fn ) {
    				return fn ?
    					jQuery.inArray( fn, list ) > -1 :
    					list.length > 0;
    			},

    			// Remove all callbacks from the list
    			empty: function() {
    				if ( list ) {
    					list = [];
    				}
    				return this;
    			},

    			// Disable .fire and .add
    			// Abort any current/pending executions
    			// Clear all callbacks and values
    			disable: function() {
    				locked = queue = [];
    				list = memory = "";
    				return this;
    			},
    			disabled: function() {
    				return !list;
    			},

    			// Disable .fire
    			// Also disable .add unless we have memory (since it would have no effect)
    			// Abort any pending executions
    			lock: function() {
    				locked = queue = [];
    				if ( !memory && !firing ) {
    					list = memory = "";
    				}
    				return this;
    			},
    			locked: function() {
    				return !!locked;
    			},

    			// Call all callbacks with the given context and arguments
    			fireWith: function( context, args ) {
    				if ( !locked ) {
    					args = args || [];
    					args = [ context, args.slice ? args.slice() : args ];
    					queue.push( args );
    					if ( !firing ) {
    						fire();
    					}
    				}
    				return this;
    			},

    			// Call all the callbacks with the given arguments
    			fire: function() {
    				self.fireWith( this, arguments );
    				return this;
    			},

    			// To know if the callbacks have already been called at least once
    			fired: function() {
    				return !!fired;
    			}
    		};

    	return self;
    };


    function Identity( v ) {
    	return v;
    }
    function Thrower( ex ) {
    	throw ex;
    }

    function adoptValue( value, resolve, reject, noValue ) {
    	var method;

    	try {

    		// Check for promise aspect first to privilege synchronous behavior
    		if ( value && isFunction( ( method = value.promise ) ) ) {
    			method.call( value ).done( resolve ).fail( reject );

    		// Other thenables
    		} else if ( value && isFunction( ( method = value.then ) ) ) {
    			method.call( value, resolve, reject );

    		// Other non-thenables
    		} else {

    			// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
    			// * false: [ value ].slice( 0 ) => resolve( value )
    			// * true: [ value ].slice( 1 ) => resolve()
    			resolve.apply( undefined, [ value ].slice( noValue ) );
    		}

    	// For Promises/A+, convert exceptions into rejections
    	// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
    	// Deferred#then to conditionally suppress rejection.
    	} catch ( value ) {

    		// Support: Android 4.0 only
    		// Strict mode functions invoked without .call/.apply get global-object context
    		reject.apply( undefined, [ value ] );
    	}
    }

    jQuery.extend( {

    	Deferred: function( func ) {
    		var tuples = [

    				// action, add listener, callbacks,
    				// ... .then handlers, argument index, [final state]
    				[ "notify", "progress", jQuery.Callbacks( "memory" ),
    					jQuery.Callbacks( "memory" ), 2 ],
    				[ "resolve", "done", jQuery.Callbacks( "once memory" ),
    					jQuery.Callbacks( "once memory" ), 0, "resolved" ],
    				[ "reject", "fail", jQuery.Callbacks( "once memory" ),
    					jQuery.Callbacks( "once memory" ), 1, "rejected" ]
    			],
    			state = "pending",
    			promise = {
    				state: function() {
    					return state;
    				},
    				always: function() {
    					deferred.done( arguments ).fail( arguments );
    					return this;
    				},
    				"catch": function( fn ) {
    					return promise.then( null, fn );
    				},

    				// Keep pipe for back-compat
    				pipe: function( /* fnDone, fnFail, fnProgress */ ) {
    					var fns = arguments;

    					return jQuery.Deferred( function( newDefer ) {
    						jQuery.each( tuples, function( _i, tuple ) {

    							// Map tuples (progress, done, fail) to arguments (done, fail, progress)
    							var fn = isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

    							// deferred.progress(function() { bind to newDefer or newDefer.notify })
    							// deferred.done(function() { bind to newDefer or newDefer.resolve })
    							// deferred.fail(function() { bind to newDefer or newDefer.reject })
    							deferred[ tuple[ 1 ] ]( function() {
    								var returned = fn && fn.apply( this, arguments );
    								if ( returned && isFunction( returned.promise ) ) {
    									returned.promise()
    										.progress( newDefer.notify )
    										.done( newDefer.resolve )
    										.fail( newDefer.reject );
    								} else {
    									newDefer[ tuple[ 0 ] + "With" ](
    										this,
    										fn ? [ returned ] : arguments
    									);
    								}
    							} );
    						} );
    						fns = null;
    					} ).promise();
    				},
    				then: function( onFulfilled, onRejected, onProgress ) {
    					var maxDepth = 0;
    					function resolve( depth, deferred, handler, special ) {
    						return function() {
    							var that = this,
    								args = arguments,
    								mightThrow = function() {
    									var returned, then;

    									// Support: Promises/A+ section 2.3.3.3.3
    									// https://promisesaplus.com/#point-59
    									// Ignore double-resolution attempts
    									if ( depth < maxDepth ) {
    										return;
    									}

    									returned = handler.apply( that, args );

    									// Support: Promises/A+ section 2.3.1
    									// https://promisesaplus.com/#point-48
    									if ( returned === deferred.promise() ) {
    										throw new TypeError( "Thenable self-resolution" );
    									}

    									// Support: Promises/A+ sections 2.3.3.1, 3.5
    									// https://promisesaplus.com/#point-54
    									// https://promisesaplus.com/#point-75
    									// Retrieve `then` only once
    									then = returned &&

    										// Support: Promises/A+ section 2.3.4
    										// https://promisesaplus.com/#point-64
    										// Only check objects and functions for thenability
    										( typeof returned === "object" ||
    											typeof returned === "function" ) &&
    										returned.then;

    									// Handle a returned thenable
    									if ( isFunction( then ) ) {

    										// Special processors (notify) just wait for resolution
    										if ( special ) {
    											then.call(
    												returned,
    												resolve( maxDepth, deferred, Identity, special ),
    												resolve( maxDepth, deferred, Thrower, special )
    											);

    										// Normal processors (resolve) also hook into progress
    										} else {

    											// ...and disregard older resolution values
    											maxDepth++;

    											then.call(
    												returned,
    												resolve( maxDepth, deferred, Identity, special ),
    												resolve( maxDepth, deferred, Thrower, special ),
    												resolve( maxDepth, deferred, Identity,
    													deferred.notifyWith )
    											);
    										}

    									// Handle all other returned values
    									} else {

    										// Only substitute handlers pass on context
    										// and multiple values (non-spec behavior)
    										if ( handler !== Identity ) {
    											that = undefined;
    											args = [ returned ];
    										}

    										// Process the value(s)
    										// Default process is resolve
    										( special || deferred.resolveWith )( that, args );
    									}
    								},

    								// Only normal processors (resolve) catch and reject exceptions
    								process = special ?
    									mightThrow :
    									function() {
    										try {
    											mightThrow();
    										} catch ( e ) {

    											if ( jQuery.Deferred.exceptionHook ) {
    												jQuery.Deferred.exceptionHook( e,
    													process.stackTrace );
    											}

    											// Support: Promises/A+ section 2.3.3.3.4.1
    											// https://promisesaplus.com/#point-61
    											// Ignore post-resolution exceptions
    											if ( depth + 1 >= maxDepth ) {

    												// Only substitute handlers pass on context
    												// and multiple values (non-spec behavior)
    												if ( handler !== Thrower ) {
    													that = undefined;
    													args = [ e ];
    												}

    												deferred.rejectWith( that, args );
    											}
    										}
    									};

    							// Support: Promises/A+ section 2.3.3.3.1
    							// https://promisesaplus.com/#point-57
    							// Re-resolve promises immediately to dodge false rejection from
    							// subsequent errors
    							if ( depth ) {
    								process();
    							} else {

    								// Call an optional hook to record the stack, in case of exception
    								// since it's otherwise lost when execution goes async
    								if ( jQuery.Deferred.getStackHook ) {
    									process.stackTrace = jQuery.Deferred.getStackHook();
    								}
    								window.setTimeout( process );
    							}
    						};
    					}

    					return jQuery.Deferred( function( newDefer ) {

    						// progress_handlers.add( ... )
    						tuples[ 0 ][ 3 ].add(
    							resolve(
    								0,
    								newDefer,
    								isFunction( onProgress ) ?
    									onProgress :
    									Identity,
    								newDefer.notifyWith
    							)
    						);

    						// fulfilled_handlers.add( ... )
    						tuples[ 1 ][ 3 ].add(
    							resolve(
    								0,
    								newDefer,
    								isFunction( onFulfilled ) ?
    									onFulfilled :
    									Identity
    							)
    						);

    						// rejected_handlers.add( ... )
    						tuples[ 2 ][ 3 ].add(
    							resolve(
    								0,
    								newDefer,
    								isFunction( onRejected ) ?
    									onRejected :
    									Thrower
    							)
    						);
    					} ).promise();
    				},

    				// Get a promise for this deferred
    				// If obj is provided, the promise aspect is added to the object
    				promise: function( obj ) {
    					return obj != null ? jQuery.extend( obj, promise ) : promise;
    				}
    			},
    			deferred = {};

    		// Add list-specific methods
    		jQuery.each( tuples, function( i, tuple ) {
    			var list = tuple[ 2 ],
    				stateString = tuple[ 5 ];

    			// promise.progress = list.add
    			// promise.done = list.add
    			// promise.fail = list.add
    			promise[ tuple[ 1 ] ] = list.add;

    			// Handle state
    			if ( stateString ) {
    				list.add(
    					function() {

    						// state = "resolved" (i.e., fulfilled)
    						// state = "rejected"
    						state = stateString;
    					},

    					// rejected_callbacks.disable
    					// fulfilled_callbacks.disable
    					tuples[ 3 - i ][ 2 ].disable,

    					// rejected_handlers.disable
    					// fulfilled_handlers.disable
    					tuples[ 3 - i ][ 3 ].disable,

    					// progress_callbacks.lock
    					tuples[ 0 ][ 2 ].lock,

    					// progress_handlers.lock
    					tuples[ 0 ][ 3 ].lock
    				);
    			}

    			// progress_handlers.fire
    			// fulfilled_handlers.fire
    			// rejected_handlers.fire
    			list.add( tuple[ 3 ].fire );

    			// deferred.notify = function() { deferred.notifyWith(...) }
    			// deferred.resolve = function() { deferred.resolveWith(...) }
    			// deferred.reject = function() { deferred.rejectWith(...) }
    			deferred[ tuple[ 0 ] ] = function() {
    				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
    				return this;
    			};

    			// deferred.notifyWith = list.fireWith
    			// deferred.resolveWith = list.fireWith
    			// deferred.rejectWith = list.fireWith
    			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
    		} );

    		// Make the deferred a promise
    		promise.promise( deferred );

    		// Call given func if any
    		if ( func ) {
    			func.call( deferred, deferred );
    		}

    		// All done!
    		return deferred;
    	},

    	// Deferred helper
    	when: function( singleValue ) {
    		var

    			// count of uncompleted subordinates
    			remaining = arguments.length,

    			// count of unprocessed arguments
    			i = remaining,

    			// subordinate fulfillment data
    			resolveContexts = Array( i ),
    			resolveValues = slice.call( arguments ),

    			// the primary Deferred
    			primary = jQuery.Deferred(),

    			// subordinate callback factory
    			updateFunc = function( i ) {
    				return function( value ) {
    					resolveContexts[ i ] = this;
    					resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
    					if ( !( --remaining ) ) {
    						primary.resolveWith( resolveContexts, resolveValues );
    					}
    				};
    			};

    		// Single- and empty arguments are adopted like Promise.resolve
    		if ( remaining <= 1 ) {
    			adoptValue( singleValue, primary.done( updateFunc( i ) ).resolve, primary.reject,
    				!remaining );

    			// Use .then() to unwrap secondary thenables (cf. gh-3000)
    			if ( primary.state() === "pending" ||
    				isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

    				return primary.then();
    			}
    		}

    		// Multiple arguments are aggregated like Promise.all array elements
    		while ( i-- ) {
    			adoptValue( resolveValues[ i ], updateFunc( i ), primary.reject );
    		}

    		return primary.promise();
    	}
    } );


    // These usually indicate a programmer mistake during development,
    // warn about them ASAP rather than swallowing them by default.
    var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

    jQuery.Deferred.exceptionHook = function( error, stack ) {

    	// Support: IE 8 - 9 only
    	// Console exists when dev tools are open, which can happen at any time
    	if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
    		window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
    	}
    };




    jQuery.readyException = function( error ) {
    	window.setTimeout( function() {
    		throw error;
    	} );
    };




    // The deferred used on DOM ready
    var readyList = jQuery.Deferred();

    jQuery.fn.ready = function( fn ) {

    	readyList
    		.then( fn )

    		// Wrap jQuery.readyException in a function so that the lookup
    		// happens at the time of error handling instead of callback
    		// registration.
    		.catch( function( error ) {
    			jQuery.readyException( error );
    		} );

    	return this;
    };

    jQuery.extend( {

    	// Is the DOM ready to be used? Set to true once it occurs.
    	isReady: false,

    	// A counter to track how many items to wait for before
    	// the ready event fires. See #6781
    	readyWait: 1,

    	// Handle when the DOM is ready
    	ready: function( wait ) {

    		// Abort if there are pending holds or we're already ready
    		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
    			return;
    		}

    		// Remember that the DOM is ready
    		jQuery.isReady = true;

    		// If a normal DOM Ready event fired, decrement, and wait if need be
    		if ( wait !== true && --jQuery.readyWait > 0 ) {
    			return;
    		}

    		// If there are functions bound, to execute
    		readyList.resolveWith( document, [ jQuery ] );
    	}
    } );

    jQuery.ready.then = readyList.then;

    // The ready event handler and self cleanup method
    function completed() {
    	document.removeEventListener( "DOMContentLoaded", completed );
    	window.removeEventListener( "load", completed );
    	jQuery.ready();
    }

    // Catch cases where $(document).ready() is called
    // after the browser event has already occurred.
    // Support: IE <=9 - 10 only
    // Older IE sometimes signals "interactive" too soon
    if ( document.readyState === "complete" ||
    	( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

    	// Handle it asynchronously to allow scripts the opportunity to delay ready
    	window.setTimeout( jQuery.ready );

    } else {

    	// Use the handy event callback
    	document.addEventListener( "DOMContentLoaded", completed );

    	// A fallback to window.onload, that will always work
    	window.addEventListener( "load", completed );
    }




    // Multifunctional method to get and set values of a collection
    // The value/s can optionally be executed if it's a function
    var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
    	var i = 0,
    		len = elems.length,
    		bulk = key == null;

    	// Sets many values
    	if ( toType( key ) === "object" ) {
    		chainable = true;
    		for ( i in key ) {
    			access( elems, fn, i, key[ i ], true, emptyGet, raw );
    		}

    	// Sets one value
    	} else if ( value !== undefined ) {
    		chainable = true;

    		if ( !isFunction( value ) ) {
    			raw = true;
    		}

    		if ( bulk ) {

    			// Bulk operations run against the entire set
    			if ( raw ) {
    				fn.call( elems, value );
    				fn = null;

    			// ...except when executing function values
    			} else {
    				bulk = fn;
    				fn = function( elem, _key, value ) {
    					return bulk.call( jQuery( elem ), value );
    				};
    			}
    		}

    		if ( fn ) {
    			for ( ; i < len; i++ ) {
    				fn(
    					elems[ i ], key, raw ?
    						value :
    						value.call( elems[ i ], i, fn( elems[ i ], key ) )
    				);
    			}
    		}
    	}

    	if ( chainable ) {
    		return elems;
    	}

    	// Gets
    	if ( bulk ) {
    		return fn.call( elems );
    	}

    	return len ? fn( elems[ 0 ], key ) : emptyGet;
    };


    // Matches dashed string for camelizing
    var rmsPrefix = /^-ms-/,
    	rdashAlpha = /-([a-z])/g;

    // Used by camelCase as callback to replace()
    function fcamelCase( _all, letter ) {
    	return letter.toUpperCase();
    }

    // Convert dashed to camelCase; used by the css and data modules
    // Support: IE <=9 - 11, Edge 12 - 15
    // Microsoft forgot to hump their vendor prefix (#9572)
    function camelCase( string ) {
    	return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
    }
    var acceptData = function( owner ) {

    	// Accepts only:
    	//  - Node
    	//    - Node.ELEMENT_NODE
    	//    - Node.DOCUMENT_NODE
    	//  - Object
    	//    - Any
    	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
    };




    function Data() {
    	this.expando = jQuery.expando + Data.uid++;
    }

    Data.uid = 1;

    Data.prototype = {

    	cache: function( owner ) {

    		// Check if the owner object already has a cache
    		var value = owner[ this.expando ];

    		// If not, create one
    		if ( !value ) {
    			value = {};

    			// We can accept data for non-element nodes in modern browsers,
    			// but we should not, see #8335.
    			// Always return an empty object.
    			if ( acceptData( owner ) ) {

    				// If it is a node unlikely to be stringify-ed or looped over
    				// use plain assignment
    				if ( owner.nodeType ) {
    					owner[ this.expando ] = value;

    				// Otherwise secure it in a non-enumerable property
    				// configurable must be true to allow the property to be
    				// deleted when data is removed
    				} else {
    					Object.defineProperty( owner, this.expando, {
    						value: value,
    						configurable: true
    					} );
    				}
    			}
    		}

    		return value;
    	},
    	set: function( owner, data, value ) {
    		var prop,
    			cache = this.cache( owner );

    		// Handle: [ owner, key, value ] args
    		// Always use camelCase key (gh-2257)
    		if ( typeof data === "string" ) {
    			cache[ camelCase( data ) ] = value;

    		// Handle: [ owner, { properties } ] args
    		} else {

    			// Copy the properties one-by-one to the cache object
    			for ( prop in data ) {
    				cache[ camelCase( prop ) ] = data[ prop ];
    			}
    		}
    		return cache;
    	},
    	get: function( owner, key ) {
    		return key === undefined ?
    			this.cache( owner ) :

    			// Always use camelCase key (gh-2257)
    			owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
    	},
    	access: function( owner, key, value ) {

    		// In cases where either:
    		//
    		//   1. No key was specified
    		//   2. A string key was specified, but no value provided
    		//
    		// Take the "read" path and allow the get method to determine
    		// which value to return, respectively either:
    		//
    		//   1. The entire cache object
    		//   2. The data stored at the key
    		//
    		if ( key === undefined ||
    				( ( key && typeof key === "string" ) && value === undefined ) ) {

    			return this.get( owner, key );
    		}

    		// When the key is not a string, or both a key and value
    		// are specified, set or extend (existing objects) with either:
    		//
    		//   1. An object of properties
    		//   2. A key and value
    		//
    		this.set( owner, key, value );

    		// Since the "set" path can have two possible entry points
    		// return the expected data based on which path was taken[*]
    		return value !== undefined ? value : key;
    	},
    	remove: function( owner, key ) {
    		var i,
    			cache = owner[ this.expando ];

    		if ( cache === undefined ) {
    			return;
    		}

    		if ( key !== undefined ) {

    			// Support array or space separated string of keys
    			if ( Array.isArray( key ) ) {

    				// If key is an array of keys...
    				// We always set camelCase keys, so remove that.
    				key = key.map( camelCase );
    			} else {
    				key = camelCase( key );

    				// If a key with the spaces exists, use it.
    				// Otherwise, create an array by matching non-whitespace
    				key = key in cache ?
    					[ key ] :
    					( key.match( rnothtmlwhite ) || [] );
    			}

    			i = key.length;

    			while ( i-- ) {
    				delete cache[ key[ i ] ];
    			}
    		}

    		// Remove the expando if there's no more data
    		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

    			// Support: Chrome <=35 - 45
    			// Webkit & Blink performance suffers when deleting properties
    			// from DOM nodes, so set to undefined instead
    			// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
    			if ( owner.nodeType ) {
    				owner[ this.expando ] = undefined;
    			} else {
    				delete owner[ this.expando ];
    			}
    		}
    	},
    	hasData: function( owner ) {
    		var cache = owner[ this.expando ];
    		return cache !== undefined && !jQuery.isEmptyObject( cache );
    	}
    };
    var dataPriv = new Data();

    var dataUser = new Data();



    //	Implementation Summary
    //
    //	1. Enforce API surface and semantic compatibility with 1.9.x branch
    //	2. Improve the module's maintainability by reducing the storage
    //		paths to a single mechanism.
    //	3. Use the same single mechanism to support "private" and "user" data.
    //	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
    //	5. Avoid exposing implementation details on user objects (eg. expando properties)
    //	6. Provide a clear path for implementation upgrade to WeakMap in 2014

    var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
    	rmultiDash = /[A-Z]/g;

    function getData( data ) {
    	if ( data === "true" ) {
    		return true;
    	}

    	if ( data === "false" ) {
    		return false;
    	}

    	if ( data === "null" ) {
    		return null;
    	}

    	// Only convert to a number if it doesn't change the string
    	if ( data === +data + "" ) {
    		return +data;
    	}

    	if ( rbrace.test( data ) ) {
    		return JSON.parse( data );
    	}

    	return data;
    }

    function dataAttr( elem, key, data ) {
    	var name;

    	// If nothing was found internally, try to fetch any
    	// data from the HTML5 data-* attribute
    	if ( data === undefined && elem.nodeType === 1 ) {
    		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
    		data = elem.getAttribute( name );

    		if ( typeof data === "string" ) {
    			try {
    				data = getData( data );
    			} catch ( e ) {}

    			// Make sure we set the data so it isn't changed later
    			dataUser.set( elem, key, data );
    		} else {
    			data = undefined;
    		}
    	}
    	return data;
    }

    jQuery.extend( {
    	hasData: function( elem ) {
    		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
    	},

    	data: function( elem, name, data ) {
    		return dataUser.access( elem, name, data );
    	},

    	removeData: function( elem, name ) {
    		dataUser.remove( elem, name );
    	},

    	// TODO: Now that all calls to _data and _removeData have been replaced
    	// with direct calls to dataPriv methods, these can be deprecated.
    	_data: function( elem, name, data ) {
    		return dataPriv.access( elem, name, data );
    	},

    	_removeData: function( elem, name ) {
    		dataPriv.remove( elem, name );
    	}
    } );

    jQuery.fn.extend( {
    	data: function( key, value ) {
    		var i, name, data,
    			elem = this[ 0 ],
    			attrs = elem && elem.attributes;

    		// Gets all values
    		if ( key === undefined ) {
    			if ( this.length ) {
    				data = dataUser.get( elem );

    				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
    					i = attrs.length;
    					while ( i-- ) {

    						// Support: IE 11 only
    						// The attrs elements can be null (#14894)
    						if ( attrs[ i ] ) {
    							name = attrs[ i ].name;
    							if ( name.indexOf( "data-" ) === 0 ) {
    								name = camelCase( name.slice( 5 ) );
    								dataAttr( elem, name, data[ name ] );
    							}
    						}
    					}
    					dataPriv.set( elem, "hasDataAttrs", true );
    				}
    			}

    			return data;
    		}

    		// Sets multiple values
    		if ( typeof key === "object" ) {
    			return this.each( function() {
    				dataUser.set( this, key );
    			} );
    		}

    		return access( this, function( value ) {
    			var data;

    			// The calling jQuery object (element matches) is not empty
    			// (and therefore has an element appears at this[ 0 ]) and the
    			// `value` parameter was not undefined. An empty jQuery object
    			// will result in `undefined` for elem = this[ 0 ] which will
    			// throw an exception if an attempt to read a data cache is made.
    			if ( elem && value === undefined ) {

    				// Attempt to get data from the cache
    				// The key will always be camelCased in Data
    				data = dataUser.get( elem, key );
    				if ( data !== undefined ) {
    					return data;
    				}

    				// Attempt to "discover" the data in
    				// HTML5 custom data-* attrs
    				data = dataAttr( elem, key );
    				if ( data !== undefined ) {
    					return data;
    				}

    				// We tried really hard, but the data doesn't exist.
    				return;
    			}

    			// Set the data...
    			this.each( function() {

    				// We always store the camelCased key
    				dataUser.set( this, key, value );
    			} );
    		}, null, value, arguments.length > 1, null, true );
    	},

    	removeData: function( key ) {
    		return this.each( function() {
    			dataUser.remove( this, key );
    		} );
    	}
    } );


    jQuery.extend( {
    	queue: function( elem, type, data ) {
    		var queue;

    		if ( elem ) {
    			type = ( type || "fx" ) + "queue";
    			queue = dataPriv.get( elem, type );

    			// Speed up dequeue by getting out quickly if this is just a lookup
    			if ( data ) {
    				if ( !queue || Array.isArray( data ) ) {
    					queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
    				} else {
    					queue.push( data );
    				}
    			}
    			return queue || [];
    		}
    	},

    	dequeue: function( elem, type ) {
    		type = type || "fx";

    		var queue = jQuery.queue( elem, type ),
    			startLength = queue.length,
    			fn = queue.shift(),
    			hooks = jQuery._queueHooks( elem, type ),
    			next = function() {
    				jQuery.dequeue( elem, type );
    			};

    		// If the fx queue is dequeued, always remove the progress sentinel
    		if ( fn === "inprogress" ) {
    			fn = queue.shift();
    			startLength--;
    		}

    		if ( fn ) {

    			// Add a progress sentinel to prevent the fx queue from being
    			// automatically dequeued
    			if ( type === "fx" ) {
    				queue.unshift( "inprogress" );
    			}

    			// Clear up the last queue stop function
    			delete hooks.stop;
    			fn.call( elem, next, hooks );
    		}

    		if ( !startLength && hooks ) {
    			hooks.empty.fire();
    		}
    	},

    	// Not public - generate a queueHooks object, or return the current one
    	_queueHooks: function( elem, type ) {
    		var key = type + "queueHooks";
    		return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
    			empty: jQuery.Callbacks( "once memory" ).add( function() {
    				dataPriv.remove( elem, [ type + "queue", key ] );
    			} )
    		} );
    	}
    } );

    jQuery.fn.extend( {
    	queue: function( type, data ) {
    		var setter = 2;

    		if ( typeof type !== "string" ) {
    			data = type;
    			type = "fx";
    			setter--;
    		}

    		if ( arguments.length < setter ) {
    			return jQuery.queue( this[ 0 ], type );
    		}

    		return data === undefined ?
    			this :
    			this.each( function() {
    				var queue = jQuery.queue( this, type, data );

    				// Ensure a hooks for this queue
    				jQuery._queueHooks( this, type );

    				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
    					jQuery.dequeue( this, type );
    				}
    			} );
    	},
    	dequeue: function( type ) {
    		return this.each( function() {
    			jQuery.dequeue( this, type );
    		} );
    	},
    	clearQueue: function( type ) {
    		return this.queue( type || "fx", [] );
    	},

    	// Get a promise resolved when queues of a certain type
    	// are emptied (fx is the type by default)
    	promise: function( type, obj ) {
    		var tmp,
    			count = 1,
    			defer = jQuery.Deferred(),
    			elements = this,
    			i = this.length,
    			resolve = function() {
    				if ( !( --count ) ) {
    					defer.resolveWith( elements, [ elements ] );
    				}
    			};

    		if ( typeof type !== "string" ) {
    			obj = type;
    			type = undefined;
    		}
    		type = type || "fx";

    		while ( i-- ) {
    			tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
    			if ( tmp && tmp.empty ) {
    				count++;
    				tmp.empty.add( resolve );
    			}
    		}
    		resolve();
    		return defer.promise( obj );
    	}
    } );
    var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

    var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


    var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

    var documentElement = document.documentElement;



    	var isAttached = function( elem ) {
    			return jQuery.contains( elem.ownerDocument, elem );
    		},
    		composed = { composed: true };

    	// Support: IE 9 - 11+, Edge 12 - 18+, iOS 10.0 - 10.2 only
    	// Check attachment across shadow DOM boundaries when possible (gh-3504)
    	// Support: iOS 10.0-10.2 only
    	// Early iOS 10 versions support `attachShadow` but not `getRootNode`,
    	// leading to errors. We need to check for `getRootNode`.
    	if ( documentElement.getRootNode ) {
    		isAttached = function( elem ) {
    			return jQuery.contains( elem.ownerDocument, elem ) ||
    				elem.getRootNode( composed ) === elem.ownerDocument;
    		};
    	}
    var isHiddenWithinTree = function( elem, el ) {

    		// isHiddenWithinTree might be called from jQuery#filter function;
    		// in that case, element will be second argument
    		elem = el || elem;

    		// Inline style trumps all
    		return elem.style.display === "none" ||
    			elem.style.display === "" &&

    			// Otherwise, check computed style
    			// Support: Firefox <=43 - 45
    			// Disconnected elements can have computed display: none, so first confirm that elem is
    			// in the document.
    			isAttached( elem ) &&

    			jQuery.css( elem, "display" ) === "none";
    	};



    function adjustCSS( elem, prop, valueParts, tween ) {
    	var adjusted, scale,
    		maxIterations = 20,
    		currentValue = tween ?
    			function() {
    				return tween.cur();
    			} :
    			function() {
    				return jQuery.css( elem, prop, "" );
    			},
    		initial = currentValue(),
    		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

    		// Starting value computation is required for potential unit mismatches
    		initialInUnit = elem.nodeType &&
    			( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
    			rcssNum.exec( jQuery.css( elem, prop ) );

    	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

    		// Support: Firefox <=54
    		// Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
    		initial = initial / 2;

    		// Trust units reported by jQuery.css
    		unit = unit || initialInUnit[ 3 ];

    		// Iteratively approximate from a nonzero starting point
    		initialInUnit = +initial || 1;

    		while ( maxIterations-- ) {

    			// Evaluate and update our best guess (doubling guesses that zero out).
    			// Finish if the scale equals or crosses 1 (making the old*new product non-positive).
    			jQuery.style( elem, prop, initialInUnit + unit );
    			if ( ( 1 - scale ) * ( 1 - ( scale = currentValue() / initial || 0.5 ) ) <= 0 ) {
    				maxIterations = 0;
    			}
    			initialInUnit = initialInUnit / scale;

    		}

    		initialInUnit = initialInUnit * 2;
    		jQuery.style( elem, prop, initialInUnit + unit );

    		// Make sure we update the tween properties later on
    		valueParts = valueParts || [];
    	}

    	if ( valueParts ) {
    		initialInUnit = +initialInUnit || +initial || 0;

    		// Apply relative offset (+=/-=) if specified
    		adjusted = valueParts[ 1 ] ?
    			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
    			+valueParts[ 2 ];
    		if ( tween ) {
    			tween.unit = unit;
    			tween.start = initialInUnit;
    			tween.end = adjusted;
    		}
    	}
    	return adjusted;
    }


    var defaultDisplayMap = {};

    function getDefaultDisplay( elem ) {
    	var temp,
    		doc = elem.ownerDocument,
    		nodeName = elem.nodeName,
    		display = defaultDisplayMap[ nodeName ];

    	if ( display ) {
    		return display;
    	}

    	temp = doc.body.appendChild( doc.createElement( nodeName ) );
    	display = jQuery.css( temp, "display" );

    	temp.parentNode.removeChild( temp );

    	if ( display === "none" ) {
    		display = "block";
    	}
    	defaultDisplayMap[ nodeName ] = display;

    	return display;
    }

    function showHide( elements, show ) {
    	var display, elem,
    		values = [],
    		index = 0,
    		length = elements.length;

    	// Determine new display value for elements that need to change
    	for ( ; index < length; index++ ) {
    		elem = elements[ index ];
    		if ( !elem.style ) {
    			continue;
    		}

    		display = elem.style.display;
    		if ( show ) {

    			// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
    			// check is required in this first loop unless we have a nonempty display value (either
    			// inline or about-to-be-restored)
    			if ( display === "none" ) {
    				values[ index ] = dataPriv.get( elem, "display" ) || null;
    				if ( !values[ index ] ) {
    					elem.style.display = "";
    				}
    			}
    			if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
    				values[ index ] = getDefaultDisplay( elem );
    			}
    		} else {
    			if ( display !== "none" ) {
    				values[ index ] = "none";

    				// Remember what we're overwriting
    				dataPriv.set( elem, "display", display );
    			}
    		}
    	}

    	// Set the display of the elements in a second loop to avoid constant reflow
    	for ( index = 0; index < length; index++ ) {
    		if ( values[ index ] != null ) {
    			elements[ index ].style.display = values[ index ];
    		}
    	}

    	return elements;
    }

    jQuery.fn.extend( {
    	show: function() {
    		return showHide( this, true );
    	},
    	hide: function() {
    		return showHide( this );
    	},
    	toggle: function( state ) {
    		if ( typeof state === "boolean" ) {
    			return state ? this.show() : this.hide();
    		}

    		return this.each( function() {
    			if ( isHiddenWithinTree( this ) ) {
    				jQuery( this ).show();
    			} else {
    				jQuery( this ).hide();
    			}
    		} );
    	}
    } );
    var rcheckableType = ( /^(?:checkbox|radio)$/i );

    var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]*)/i );

    var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );



    ( function() {
    	var fragment = document.createDocumentFragment(),
    		div = fragment.appendChild( document.createElement( "div" ) ),
    		input = document.createElement( "input" );

    	// Support: Android 4.0 - 4.3 only
    	// Check state lost if the name is set (#11217)
    	// Support: Windows Web Apps (WWA)
    	// `name` and `type` must use .setAttribute for WWA (#14901)
    	input.setAttribute( "type", "radio" );
    	input.setAttribute( "checked", "checked" );
    	input.setAttribute( "name", "t" );

    	div.appendChild( input );

    	// Support: Android <=4.1 only
    	// Older WebKit doesn't clone checked state correctly in fragments
    	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

    	// Support: IE <=11 only
    	// Make sure textarea (and checkbox) defaultValue is properly cloned
    	div.innerHTML = "<textarea>x</textarea>";
    	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;

    	// Support: IE <=9 only
    	// IE <=9 replaces <option> tags with their contents when inserted outside of
    	// the select element.
    	div.innerHTML = "<option></option>";
    	support.option = !!div.lastChild;
    } )();


    // We have to close these tags to support XHTML (#13200)
    var wrapMap = {

    	// XHTML parsers do not magically insert elements in the
    	// same way that tag soup parsers do. So we cannot shorten
    	// this by omitting <tbody> or other required elements.
    	thead: [ 1, "<table>", "</table>" ],
    	col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
    	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
    	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

    	_default: [ 0, "", "" ]
    };

    wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
    wrapMap.th = wrapMap.td;

    // Support: IE <=9 only
    if ( !support.option ) {
    	wrapMap.optgroup = wrapMap.option = [ 1, "<select multiple='multiple'>", "</select>" ];
    }


    function getAll( context, tag ) {

    	// Support: IE <=9 - 11 only
    	// Use typeof to avoid zero-argument method invocation on host objects (#15151)
    	var ret;

    	if ( typeof context.getElementsByTagName !== "undefined" ) {
    		ret = context.getElementsByTagName( tag || "*" );

    	} else if ( typeof context.querySelectorAll !== "undefined" ) {
    		ret = context.querySelectorAll( tag || "*" );

    	} else {
    		ret = [];
    	}

    	if ( tag === undefined || tag && nodeName( context, tag ) ) {
    		return jQuery.merge( [ context ], ret );
    	}

    	return ret;
    }


    // Mark scripts as having already been evaluated
    function setGlobalEval( elems, refElements ) {
    	var i = 0,
    		l = elems.length;

    	for ( ; i < l; i++ ) {
    		dataPriv.set(
    			elems[ i ],
    			"globalEval",
    			!refElements || dataPriv.get( refElements[ i ], "globalEval" )
    		);
    	}
    }


    var rhtml = /<|&#?\w+;/;

    function buildFragment( elems, context, scripts, selection, ignored ) {
    	var elem, tmp, tag, wrap, attached, j,
    		fragment = context.createDocumentFragment(),
    		nodes = [],
    		i = 0,
    		l = elems.length;

    	for ( ; i < l; i++ ) {
    		elem = elems[ i ];

    		if ( elem || elem === 0 ) {

    			// Add nodes directly
    			if ( toType( elem ) === "object" ) {

    				// Support: Android <=4.0 only, PhantomJS 1 only
    				// push.apply(_, arraylike) throws on ancient WebKit
    				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

    			// Convert non-html into a text node
    			} else if ( !rhtml.test( elem ) ) {
    				nodes.push( context.createTextNode( elem ) );

    			// Convert html into DOM nodes
    			} else {
    				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

    				// Deserialize a standard representation
    				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
    				wrap = wrapMap[ tag ] || wrapMap._default;
    				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

    				// Descend through wrappers to the right content
    				j = wrap[ 0 ];
    				while ( j-- ) {
    					tmp = tmp.lastChild;
    				}

    				// Support: Android <=4.0 only, PhantomJS 1 only
    				// push.apply(_, arraylike) throws on ancient WebKit
    				jQuery.merge( nodes, tmp.childNodes );

    				// Remember the top-level container
    				tmp = fragment.firstChild;

    				// Ensure the created nodes are orphaned (#12392)
    				tmp.textContent = "";
    			}
    		}
    	}

    	// Remove wrapper from fragment
    	fragment.textContent = "";

    	i = 0;
    	while ( ( elem = nodes[ i++ ] ) ) {

    		// Skip elements already in the context collection (trac-4087)
    		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
    			if ( ignored ) {
    				ignored.push( elem );
    			}
    			continue;
    		}

    		attached = isAttached( elem );

    		// Append to fragment
    		tmp = getAll( fragment.appendChild( elem ), "script" );

    		// Preserve script evaluation history
    		if ( attached ) {
    			setGlobalEval( tmp );
    		}

    		// Capture executables
    		if ( scripts ) {
    			j = 0;
    			while ( ( elem = tmp[ j++ ] ) ) {
    				if ( rscriptType.test( elem.type || "" ) ) {
    					scripts.push( elem );
    				}
    			}
    		}
    	}

    	return fragment;
    }


    var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

    function returnTrue() {
    	return true;
    }

    function returnFalse() {
    	return false;
    }

    // Support: IE <=9 - 11+
    // focus() and blur() are asynchronous, except when they are no-op.
    // So expect focus to be synchronous when the element is already active,
    // and blur to be synchronous when the element is not already active.
    // (focus and blur are always synchronous in other supported browsers,
    // this just defines when we can count on it).
    function expectSync( elem, type ) {
    	return ( elem === safeActiveElement() ) === ( type === "focus" );
    }

    // Support: IE <=9 only
    // Accessing document.activeElement can throw unexpectedly
    // https://bugs.jquery.com/ticket/13393
    function safeActiveElement() {
    	try {
    		return document.activeElement;
    	} catch ( err ) { }
    }

    function on( elem, types, selector, data, fn, one ) {
    	var origFn, type;

    	// Types can be a map of types/handlers
    	if ( typeof types === "object" ) {

    		// ( types-Object, selector, data )
    		if ( typeof selector !== "string" ) {

    			// ( types-Object, data )
    			data = data || selector;
    			selector = undefined;
    		}
    		for ( type in types ) {
    			on( elem, type, selector, data, types[ type ], one );
    		}
    		return elem;
    	}

    	if ( data == null && fn == null ) {

    		// ( types, fn )
    		fn = selector;
    		data = selector = undefined;
    	} else if ( fn == null ) {
    		if ( typeof selector === "string" ) {

    			// ( types, selector, fn )
    			fn = data;
    			data = undefined;
    		} else {

    			// ( types, data, fn )
    			fn = data;
    			data = selector;
    			selector = undefined;
    		}
    	}
    	if ( fn === false ) {
    		fn = returnFalse;
    	} else if ( !fn ) {
    		return elem;
    	}

    	if ( one === 1 ) {
    		origFn = fn;
    		fn = function( event ) {

    			// Can use an empty set, since event contains the info
    			jQuery().off( event );
    			return origFn.apply( this, arguments );
    		};

    		// Use same guid so caller can remove using origFn
    		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
    	}
    	return elem.each( function() {
    		jQuery.event.add( this, types, fn, data, selector );
    	} );
    }

    /*
     * Helper functions for managing events -- not part of the public interface.
     * Props to Dean Edwards' addEvent library for many of the ideas.
     */
    jQuery.event = {

    	global: {},

    	add: function( elem, types, handler, data, selector ) {

    		var handleObjIn, eventHandle, tmp,
    			events, t, handleObj,
    			special, handlers, type, namespaces, origType,
    			elemData = dataPriv.get( elem );

    		// Only attach events to objects that accept data
    		if ( !acceptData( elem ) ) {
    			return;
    		}

    		// Caller can pass in an object of custom data in lieu of the handler
    		if ( handler.handler ) {
    			handleObjIn = handler;
    			handler = handleObjIn.handler;
    			selector = handleObjIn.selector;
    		}

    		// Ensure that invalid selectors throw exceptions at attach time
    		// Evaluate against documentElement in case elem is a non-element node (e.g., document)
    		if ( selector ) {
    			jQuery.find.matchesSelector( documentElement, selector );
    		}

    		// Make sure that the handler has a unique ID, used to find/remove it later
    		if ( !handler.guid ) {
    			handler.guid = jQuery.guid++;
    		}

    		// Init the element's event structure and main handler, if this is the first
    		if ( !( events = elemData.events ) ) {
    			events = elemData.events = Object.create( null );
    		}
    		if ( !( eventHandle = elemData.handle ) ) {
    			eventHandle = elemData.handle = function( e ) {

    				// Discard the second event of a jQuery.event.trigger() and
    				// when an event is called after a page has unloaded
    				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
    					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
    			};
    		}

    		// Handle multiple events separated by a space
    		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
    		t = types.length;
    		while ( t-- ) {
    			tmp = rtypenamespace.exec( types[ t ] ) || [];
    			type = origType = tmp[ 1 ];
    			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

    			// There *must* be a type, no attaching namespace-only handlers
    			if ( !type ) {
    				continue;
    			}

    			// If event changes its type, use the special event handlers for the changed type
    			special = jQuery.event.special[ type ] || {};

    			// If selector defined, determine special event api type, otherwise given type
    			type = ( selector ? special.delegateType : special.bindType ) || type;

    			// Update special based on newly reset type
    			special = jQuery.event.special[ type ] || {};

    			// handleObj is passed to all event handlers
    			handleObj = jQuery.extend( {
    				type: type,
    				origType: origType,
    				data: data,
    				handler: handler,
    				guid: handler.guid,
    				selector: selector,
    				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
    				namespace: namespaces.join( "." )
    			}, handleObjIn );

    			// Init the event handler queue if we're the first
    			if ( !( handlers = events[ type ] ) ) {
    				handlers = events[ type ] = [];
    				handlers.delegateCount = 0;

    				// Only use addEventListener if the special events handler returns false
    				if ( !special.setup ||
    					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

    					if ( elem.addEventListener ) {
    						elem.addEventListener( type, eventHandle );
    					}
    				}
    			}

    			if ( special.add ) {
    				special.add.call( elem, handleObj );

    				if ( !handleObj.handler.guid ) {
    					handleObj.handler.guid = handler.guid;
    				}
    			}

    			// Add to the element's handler list, delegates in front
    			if ( selector ) {
    				handlers.splice( handlers.delegateCount++, 0, handleObj );
    			} else {
    				handlers.push( handleObj );
    			}

    			// Keep track of which events have ever been used, for event optimization
    			jQuery.event.global[ type ] = true;
    		}

    	},

    	// Detach an event or set of events from an element
    	remove: function( elem, types, handler, selector, mappedTypes ) {

    		var j, origCount, tmp,
    			events, t, handleObj,
    			special, handlers, type, namespaces, origType,
    			elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

    		if ( !elemData || !( events = elemData.events ) ) {
    			return;
    		}

    		// Once for each type.namespace in types; type may be omitted
    		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
    		t = types.length;
    		while ( t-- ) {
    			tmp = rtypenamespace.exec( types[ t ] ) || [];
    			type = origType = tmp[ 1 ];
    			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

    			// Unbind all events (on this namespace, if provided) for the element
    			if ( !type ) {
    				for ( type in events ) {
    					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
    				}
    				continue;
    			}

    			special = jQuery.event.special[ type ] || {};
    			type = ( selector ? special.delegateType : special.bindType ) || type;
    			handlers = events[ type ] || [];
    			tmp = tmp[ 2 ] &&
    				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

    			// Remove matching events
    			origCount = j = handlers.length;
    			while ( j-- ) {
    				handleObj = handlers[ j ];

    				if ( ( mappedTypes || origType === handleObj.origType ) &&
    					( !handler || handler.guid === handleObj.guid ) &&
    					( !tmp || tmp.test( handleObj.namespace ) ) &&
    					( !selector || selector === handleObj.selector ||
    						selector === "**" && handleObj.selector ) ) {
    					handlers.splice( j, 1 );

    					if ( handleObj.selector ) {
    						handlers.delegateCount--;
    					}
    					if ( special.remove ) {
    						special.remove.call( elem, handleObj );
    					}
    				}
    			}

    			// Remove generic event handler if we removed something and no more handlers exist
    			// (avoids potential for endless recursion during removal of special event handlers)
    			if ( origCount && !handlers.length ) {
    				if ( !special.teardown ||
    					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

    					jQuery.removeEvent( elem, type, elemData.handle );
    				}

    				delete events[ type ];
    			}
    		}

    		// Remove data and the expando if it's no longer used
    		if ( jQuery.isEmptyObject( events ) ) {
    			dataPriv.remove( elem, "handle events" );
    		}
    	},

    	dispatch: function( nativeEvent ) {

    		var i, j, ret, matched, handleObj, handlerQueue,
    			args = new Array( arguments.length ),

    			// Make a writable jQuery.Event from the native event object
    			event = jQuery.event.fix( nativeEvent ),

    			handlers = (
    				dataPriv.get( this, "events" ) || Object.create( null )
    			)[ event.type ] || [],
    			special = jQuery.event.special[ event.type ] || {};

    		// Use the fix-ed jQuery.Event rather than the (read-only) native event
    		args[ 0 ] = event;

    		for ( i = 1; i < arguments.length; i++ ) {
    			args[ i ] = arguments[ i ];
    		}

    		event.delegateTarget = this;

    		// Call the preDispatch hook for the mapped type, and let it bail if desired
    		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
    			return;
    		}

    		// Determine handlers
    		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

    		// Run delegates first; they may want to stop propagation beneath us
    		i = 0;
    		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
    			event.currentTarget = matched.elem;

    			j = 0;
    			while ( ( handleObj = matched.handlers[ j++ ] ) &&
    				!event.isImmediatePropagationStopped() ) {

    				// If the event is namespaced, then each handler is only invoked if it is
    				// specially universal or its namespaces are a superset of the event's.
    				if ( !event.rnamespace || handleObj.namespace === false ||
    					event.rnamespace.test( handleObj.namespace ) ) {

    					event.handleObj = handleObj;
    					event.data = handleObj.data;

    					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
    						handleObj.handler ).apply( matched.elem, args );

    					if ( ret !== undefined ) {
    						if ( ( event.result = ret ) === false ) {
    							event.preventDefault();
    							event.stopPropagation();
    						}
    					}
    				}
    			}
    		}

    		// Call the postDispatch hook for the mapped type
    		if ( special.postDispatch ) {
    			special.postDispatch.call( this, event );
    		}

    		return event.result;
    	},

    	handlers: function( event, handlers ) {
    		var i, handleObj, sel, matchedHandlers, matchedSelectors,
    			handlerQueue = [],
    			delegateCount = handlers.delegateCount,
    			cur = event.target;

    		// Find delegate handlers
    		if ( delegateCount &&

    			// Support: IE <=9
    			// Black-hole SVG <use> instance trees (trac-13180)
    			cur.nodeType &&

    			// Support: Firefox <=42
    			// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
    			// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
    			// Support: IE 11 only
    			// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
    			!( event.type === "click" && event.button >= 1 ) ) {

    			for ( ; cur !== this; cur = cur.parentNode || this ) {

    				// Don't check non-elements (#13208)
    				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
    				if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {
    					matchedHandlers = [];
    					matchedSelectors = {};
    					for ( i = 0; i < delegateCount; i++ ) {
    						handleObj = handlers[ i ];

    						// Don't conflict with Object.prototype properties (#13203)
    						sel = handleObj.selector + " ";

    						if ( matchedSelectors[ sel ] === undefined ) {
    							matchedSelectors[ sel ] = handleObj.needsContext ?
    								jQuery( sel, this ).index( cur ) > -1 :
    								jQuery.find( sel, this, null, [ cur ] ).length;
    						}
    						if ( matchedSelectors[ sel ] ) {
    							matchedHandlers.push( handleObj );
    						}
    					}
    					if ( matchedHandlers.length ) {
    						handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
    					}
    				}
    			}
    		}

    		// Add the remaining (directly-bound) handlers
    		cur = this;
    		if ( delegateCount < handlers.length ) {
    			handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
    		}

    		return handlerQueue;
    	},

    	addProp: function( name, hook ) {
    		Object.defineProperty( jQuery.Event.prototype, name, {
    			enumerable: true,
    			configurable: true,

    			get: isFunction( hook ) ?
    				function() {
    					if ( this.originalEvent ) {
    						return hook( this.originalEvent );
    					}
    				} :
    				function() {
    					if ( this.originalEvent ) {
    						return this.originalEvent[ name ];
    					}
    				},

    			set: function( value ) {
    				Object.defineProperty( this, name, {
    					enumerable: true,
    					configurable: true,
    					writable: true,
    					value: value
    				} );
    			}
    		} );
    	},

    	fix: function( originalEvent ) {
    		return originalEvent[ jQuery.expando ] ?
    			originalEvent :
    			new jQuery.Event( originalEvent );
    	},

    	special: {
    		load: {

    			// Prevent triggered image.load events from bubbling to window.load
    			noBubble: true
    		},
    		click: {

    			// Utilize native event to ensure correct state for checkable inputs
    			setup: function( data ) {

    				// For mutual compressibility with _default, replace `this` access with a local var.
    				// `|| data` is dead code meant only to preserve the variable through minification.
    				var el = this || data;

    				// Claim the first handler
    				if ( rcheckableType.test( el.type ) &&
    					el.click && nodeName( el, "input" ) ) {

    					// dataPriv.set( el, "click", ... )
    					leverageNative( el, "click", returnTrue );
    				}

    				// Return false to allow normal processing in the caller
    				return false;
    			},
    			trigger: function( data ) {

    				// For mutual compressibility with _default, replace `this` access with a local var.
    				// `|| data` is dead code meant only to preserve the variable through minification.
    				var el = this || data;

    				// Force setup before triggering a click
    				if ( rcheckableType.test( el.type ) &&
    					el.click && nodeName( el, "input" ) ) {

    					leverageNative( el, "click" );
    				}

    				// Return non-false to allow normal event-path propagation
    				return true;
    			},

    			// For cross-browser consistency, suppress native .click() on links
    			// Also prevent it if we're currently inside a leveraged native-event stack
    			_default: function( event ) {
    				var target = event.target;
    				return rcheckableType.test( target.type ) &&
    					target.click && nodeName( target, "input" ) &&
    					dataPriv.get( target, "click" ) ||
    					nodeName( target, "a" );
    			}
    		},

    		beforeunload: {
    			postDispatch: function( event ) {

    				// Support: Firefox 20+
    				// Firefox doesn't alert if the returnValue field is not set.
    				if ( event.result !== undefined && event.originalEvent ) {
    					event.originalEvent.returnValue = event.result;
    				}
    			}
    		}
    	}
    };

    // Ensure the presence of an event listener that handles manually-triggered
    // synthetic events by interrupting progress until reinvoked in response to
    // *native* events that it fires directly, ensuring that state changes have
    // already occurred before other listeners are invoked.
    function leverageNative( el, type, expectSync ) {

    	// Missing expectSync indicates a trigger call, which must force setup through jQuery.event.add
    	if ( !expectSync ) {
    		if ( dataPriv.get( el, type ) === undefined ) {
    			jQuery.event.add( el, type, returnTrue );
    		}
    		return;
    	}

    	// Register the controller as a special universal handler for all event namespaces
    	dataPriv.set( el, type, false );
    	jQuery.event.add( el, type, {
    		namespace: false,
    		handler: function( event ) {
    			var notAsync, result,
    				saved = dataPriv.get( this, type );

    			if ( ( event.isTrigger & 1 ) && this[ type ] ) {

    				// Interrupt processing of the outer synthetic .trigger()ed event
    				// Saved data should be false in such cases, but might be a leftover capture object
    				// from an async native handler (gh-4350)
    				if ( !saved.length ) {

    					// Store arguments for use when handling the inner native event
    					// There will always be at least one argument (an event object), so this array
    					// will not be confused with a leftover capture object.
    					saved = slice.call( arguments );
    					dataPriv.set( this, type, saved );

    					// Trigger the native event and capture its result
    					// Support: IE <=9 - 11+
    					// focus() and blur() are asynchronous
    					notAsync = expectSync( this, type );
    					this[ type ]();
    					result = dataPriv.get( this, type );
    					if ( saved !== result || notAsync ) {
    						dataPriv.set( this, type, false );
    					} else {
    						result = {};
    					}
    					if ( saved !== result ) {

    						// Cancel the outer synthetic event
    						event.stopImmediatePropagation();
    						event.preventDefault();

    						// Support: Chrome 86+
    						// In Chrome, if an element having a focusout handler is blurred by
    						// clicking outside of it, it invokes the handler synchronously. If
    						// that handler calls `.remove()` on the element, the data is cleared,
    						// leaving `result` undefined. We need to guard against this.
    						return result && result.value;
    					}

    				// If this is an inner synthetic event for an event with a bubbling surrogate
    				// (focus or blur), assume that the surrogate already propagated from triggering the
    				// native event and prevent that from happening again here.
    				// This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the
    				// bubbling surrogate propagates *after* the non-bubbling base), but that seems
    				// less bad than duplication.
    				} else if ( ( jQuery.event.special[ type ] || {} ).delegateType ) {
    					event.stopPropagation();
    				}

    			// If this is a native event triggered above, everything is now in order
    			// Fire an inner synthetic event with the original arguments
    			} else if ( saved.length ) {

    				// ...and capture the result
    				dataPriv.set( this, type, {
    					value: jQuery.event.trigger(

    						// Support: IE <=9 - 11+
    						// Extend with the prototype to reset the above stopImmediatePropagation()
    						jQuery.extend( saved[ 0 ], jQuery.Event.prototype ),
    						saved.slice( 1 ),
    						this
    					)
    				} );

    				// Abort handling of the native event
    				event.stopImmediatePropagation();
    			}
    		}
    	} );
    }

    jQuery.removeEvent = function( elem, type, handle ) {

    	// This "if" is needed for plain objects
    	if ( elem.removeEventListener ) {
    		elem.removeEventListener( type, handle );
    	}
    };

    jQuery.Event = function( src, props ) {

    	// Allow instantiation without the 'new' keyword
    	if ( !( this instanceof jQuery.Event ) ) {
    		return new jQuery.Event( src, props );
    	}

    	// Event object
    	if ( src && src.type ) {
    		this.originalEvent = src;
    		this.type = src.type;

    		// Events bubbling up the document may have been marked as prevented
    		// by a handler lower down the tree; reflect the correct value.
    		this.isDefaultPrevented = src.defaultPrevented ||
    				src.defaultPrevented === undefined &&

    				// Support: Android <=2.3 only
    				src.returnValue === false ?
    			returnTrue :
    			returnFalse;

    		// Create target properties
    		// Support: Safari <=6 - 7 only
    		// Target should not be a text node (#504, #13143)
    		this.target = ( src.target && src.target.nodeType === 3 ) ?
    			src.target.parentNode :
    			src.target;

    		this.currentTarget = src.currentTarget;
    		this.relatedTarget = src.relatedTarget;

    	// Event type
    	} else {
    		this.type = src;
    	}

    	// Put explicitly provided properties onto the event object
    	if ( props ) {
    		jQuery.extend( this, props );
    	}

    	// Create a timestamp if incoming event doesn't have one
    	this.timeStamp = src && src.timeStamp || Date.now();

    	// Mark it as fixed
    	this[ jQuery.expando ] = true;
    };

    // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
    // https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
    jQuery.Event.prototype = {
    	constructor: jQuery.Event,
    	isDefaultPrevented: returnFalse,
    	isPropagationStopped: returnFalse,
    	isImmediatePropagationStopped: returnFalse,
    	isSimulated: false,

    	preventDefault: function() {
    		var e = this.originalEvent;

    		this.isDefaultPrevented = returnTrue;

    		if ( e && !this.isSimulated ) {
    			e.preventDefault();
    		}
    	},
    	stopPropagation: function() {
    		var e = this.originalEvent;

    		this.isPropagationStopped = returnTrue;

    		if ( e && !this.isSimulated ) {
    			e.stopPropagation();
    		}
    	},
    	stopImmediatePropagation: function() {
    		var e = this.originalEvent;

    		this.isImmediatePropagationStopped = returnTrue;

    		if ( e && !this.isSimulated ) {
    			e.stopImmediatePropagation();
    		}

    		this.stopPropagation();
    	}
    };

    // Includes all common event props including KeyEvent and MouseEvent specific props
    jQuery.each( {
    	altKey: true,
    	bubbles: true,
    	cancelable: true,
    	changedTouches: true,
    	ctrlKey: true,
    	detail: true,
    	eventPhase: true,
    	metaKey: true,
    	pageX: true,
    	pageY: true,
    	shiftKey: true,
    	view: true,
    	"char": true,
    	code: true,
    	charCode: true,
    	key: true,
    	keyCode: true,
    	button: true,
    	buttons: true,
    	clientX: true,
    	clientY: true,
    	offsetX: true,
    	offsetY: true,
    	pointerId: true,
    	pointerType: true,
    	screenX: true,
    	screenY: true,
    	targetTouches: true,
    	toElement: true,
    	touches: true,
    	which: true
    }, jQuery.event.addProp );

    jQuery.each( { focus: "focusin", blur: "focusout" }, function( type, delegateType ) {
    	jQuery.event.special[ type ] = {

    		// Utilize native event if possible so blur/focus sequence is correct
    		setup: function() {

    			// Claim the first handler
    			// dataPriv.set( this, "focus", ... )
    			// dataPriv.set( this, "blur", ... )
    			leverageNative( this, type, expectSync );

    			// Return false to allow normal processing in the caller
    			return false;
    		},
    		trigger: function() {

    			// Force setup before trigger
    			leverageNative( this, type );

    			// Return non-false to allow normal event-path propagation
    			return true;
    		},

    		// Suppress native focus or blur as it's already being fired
    		// in leverageNative.
    		_default: function() {
    			return true;
    		},

    		delegateType: delegateType
    	};
    } );

    // Create mouseenter/leave events using mouseover/out and event-time checks
    // so that event delegation works in jQuery.
    // Do the same for pointerenter/pointerleave and pointerover/pointerout
    //
    // Support: Safari 7 only
    // Safari sends mouseenter too often; see:
    // https://bugs.chromium.org/p/chromium/issues/detail?id=470258
    // for the description of the bug (it existed in older Chrome versions as well).
    jQuery.each( {
    	mouseenter: "mouseover",
    	mouseleave: "mouseout",
    	pointerenter: "pointerover",
    	pointerleave: "pointerout"
    }, function( orig, fix ) {
    	jQuery.event.special[ orig ] = {
    		delegateType: fix,
    		bindType: fix,

    		handle: function( event ) {
    			var ret,
    				target = this,
    				related = event.relatedTarget,
    				handleObj = event.handleObj;

    			// For mouseenter/leave call the handler if related is outside the target.
    			// NB: No relatedTarget if the mouse left/entered the browser window
    			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
    				event.type = handleObj.origType;
    				ret = handleObj.handler.apply( this, arguments );
    				event.type = fix;
    			}
    			return ret;
    		}
    	};
    } );

    jQuery.fn.extend( {

    	on: function( types, selector, data, fn ) {
    		return on( this, types, selector, data, fn );
    	},
    	one: function( types, selector, data, fn ) {
    		return on( this, types, selector, data, fn, 1 );
    	},
    	off: function( types, selector, fn ) {
    		var handleObj, type;
    		if ( types && types.preventDefault && types.handleObj ) {

    			// ( event )  dispatched jQuery.Event
    			handleObj = types.handleObj;
    			jQuery( types.delegateTarget ).off(
    				handleObj.namespace ?
    					handleObj.origType + "." + handleObj.namespace :
    					handleObj.origType,
    				handleObj.selector,
    				handleObj.handler
    			);
    			return this;
    		}
    		if ( typeof types === "object" ) {

    			// ( types-object [, selector] )
    			for ( type in types ) {
    				this.off( type, selector, types[ type ] );
    			}
    			return this;
    		}
    		if ( selector === false || typeof selector === "function" ) {

    			// ( types [, fn] )
    			fn = selector;
    			selector = undefined;
    		}
    		if ( fn === false ) {
    			fn = returnFalse;
    		}
    		return this.each( function() {
    			jQuery.event.remove( this, types, fn, selector );
    		} );
    	}
    } );


    var

    	// Support: IE <=10 - 11, Edge 12 - 13 only
    	// In IE/Edge using regex groups here causes severe slowdowns.
    	// See https://connect.microsoft.com/IE/feedback/details/1736512/
    	rnoInnerhtml = /<script|<style|<link/i,

    	// checked="checked" or checked
    	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
    	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

    // Prefer a tbody over its parent table for containing new rows
    function manipulationTarget( elem, content ) {
    	if ( nodeName( elem, "table" ) &&
    		nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

    		return jQuery( elem ).children( "tbody" )[ 0 ] || elem;
    	}

    	return elem;
    }

    // Replace/restore the type attribute of script elements for safe DOM manipulation
    function disableScript( elem ) {
    	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
    	return elem;
    }
    function restoreScript( elem ) {
    	if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {
    		elem.type = elem.type.slice( 5 );
    	} else {
    		elem.removeAttribute( "type" );
    	}

    	return elem;
    }

    function cloneCopyEvent( src, dest ) {
    	var i, l, type, pdataOld, udataOld, udataCur, events;

    	if ( dest.nodeType !== 1 ) {
    		return;
    	}

    	// 1. Copy private data: events, handlers, etc.
    	if ( dataPriv.hasData( src ) ) {
    		pdataOld = dataPriv.get( src );
    		events = pdataOld.events;

    		if ( events ) {
    			dataPriv.remove( dest, "handle events" );

    			for ( type in events ) {
    				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
    					jQuery.event.add( dest, type, events[ type ][ i ] );
    				}
    			}
    		}
    	}

    	// 2. Copy user data
    	if ( dataUser.hasData( src ) ) {
    		udataOld = dataUser.access( src );
    		udataCur = jQuery.extend( {}, udataOld );

    		dataUser.set( dest, udataCur );
    	}
    }

    // Fix IE bugs, see support tests
    function fixInput( src, dest ) {
    	var nodeName = dest.nodeName.toLowerCase();

    	// Fails to persist the checked state of a cloned checkbox or radio button.
    	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
    		dest.checked = src.checked;

    	// Fails to return the selected option to the default selected state when cloning options
    	} else if ( nodeName === "input" || nodeName === "textarea" ) {
    		dest.defaultValue = src.defaultValue;
    	}
    }

    function domManip( collection, args, callback, ignored ) {

    	// Flatten any nested arrays
    	args = flat( args );

    	var fragment, first, scripts, hasScripts, node, doc,
    		i = 0,
    		l = collection.length,
    		iNoClone = l - 1,
    		value = args[ 0 ],
    		valueIsFunction = isFunction( value );

    	// We can't cloneNode fragments that contain checked, in WebKit
    	if ( valueIsFunction ||
    			( l > 1 && typeof value === "string" &&
    				!support.checkClone && rchecked.test( value ) ) ) {
    		return collection.each( function( index ) {
    			var self = collection.eq( index );
    			if ( valueIsFunction ) {
    				args[ 0 ] = value.call( this, index, self.html() );
    			}
    			domManip( self, args, callback, ignored );
    		} );
    	}

    	if ( l ) {
    		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
    		first = fragment.firstChild;

    		if ( fragment.childNodes.length === 1 ) {
    			fragment = first;
    		}

    		// Require either new content or an interest in ignored elements to invoke the callback
    		if ( first || ignored ) {
    			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
    			hasScripts = scripts.length;

    			// Use the original fragment for the last item
    			// instead of the first because it can end up
    			// being emptied incorrectly in certain situations (#8070).
    			for ( ; i < l; i++ ) {
    				node = fragment;

    				if ( i !== iNoClone ) {
    					node = jQuery.clone( node, true, true );

    					// Keep references to cloned scripts for later restoration
    					if ( hasScripts ) {

    						// Support: Android <=4.0 only, PhantomJS 1 only
    						// push.apply(_, arraylike) throws on ancient WebKit
    						jQuery.merge( scripts, getAll( node, "script" ) );
    					}
    				}

    				callback.call( collection[ i ], node, i );
    			}

    			if ( hasScripts ) {
    				doc = scripts[ scripts.length - 1 ].ownerDocument;

    				// Reenable scripts
    				jQuery.map( scripts, restoreScript );

    				// Evaluate executable scripts on first document insertion
    				for ( i = 0; i < hasScripts; i++ ) {
    					node = scripts[ i ];
    					if ( rscriptType.test( node.type || "" ) &&
    						!dataPriv.access( node, "globalEval" ) &&
    						jQuery.contains( doc, node ) ) {

    						if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {

    							// Optional AJAX dependency, but won't run scripts if not present
    							if ( jQuery._evalUrl && !node.noModule ) {
    								jQuery._evalUrl( node.src, {
    									nonce: node.nonce || node.getAttribute( "nonce" )
    								}, doc );
    							}
    						} else {
    							DOMEval( node.textContent.replace( rcleanScript, "" ), node, doc );
    						}
    					}
    				}
    			}
    		}
    	}

    	return collection;
    }

    function remove( elem, selector, keepData ) {
    	var node,
    		nodes = selector ? jQuery.filter( selector, elem ) : elem,
    		i = 0;

    	for ( ; ( node = nodes[ i ] ) != null; i++ ) {
    		if ( !keepData && node.nodeType === 1 ) {
    			jQuery.cleanData( getAll( node ) );
    		}

    		if ( node.parentNode ) {
    			if ( keepData && isAttached( node ) ) {
    				setGlobalEval( getAll( node, "script" ) );
    			}
    			node.parentNode.removeChild( node );
    		}
    	}

    	return elem;
    }

    jQuery.extend( {
    	htmlPrefilter: function( html ) {
    		return html;
    	},

    	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
    		var i, l, srcElements, destElements,
    			clone = elem.cloneNode( true ),
    			inPage = isAttached( elem );

    		// Fix IE cloning issues
    		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
    				!jQuery.isXMLDoc( elem ) ) {

    			// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
    			destElements = getAll( clone );
    			srcElements = getAll( elem );

    			for ( i = 0, l = srcElements.length; i < l; i++ ) {
    				fixInput( srcElements[ i ], destElements[ i ] );
    			}
    		}

    		// Copy the events from the original to the clone
    		if ( dataAndEvents ) {
    			if ( deepDataAndEvents ) {
    				srcElements = srcElements || getAll( elem );
    				destElements = destElements || getAll( clone );

    				for ( i = 0, l = srcElements.length; i < l; i++ ) {
    					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
    				}
    			} else {
    				cloneCopyEvent( elem, clone );
    			}
    		}

    		// Preserve script evaluation history
    		destElements = getAll( clone, "script" );
    		if ( destElements.length > 0 ) {
    			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
    		}

    		// Return the cloned set
    		return clone;
    	},

    	cleanData: function( elems ) {
    		var data, elem, type,
    			special = jQuery.event.special,
    			i = 0;

    		for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
    			if ( acceptData( elem ) ) {
    				if ( ( data = elem[ dataPriv.expando ] ) ) {
    					if ( data.events ) {
    						for ( type in data.events ) {
    							if ( special[ type ] ) {
    								jQuery.event.remove( elem, type );

    							// This is a shortcut to avoid jQuery.event.remove's overhead
    							} else {
    								jQuery.removeEvent( elem, type, data.handle );
    							}
    						}
    					}

    					// Support: Chrome <=35 - 45+
    					// Assign undefined instead of using delete, see Data#remove
    					elem[ dataPriv.expando ] = undefined;
    				}
    				if ( elem[ dataUser.expando ] ) {

    					// Support: Chrome <=35 - 45+
    					// Assign undefined instead of using delete, see Data#remove
    					elem[ dataUser.expando ] = undefined;
    				}
    			}
    		}
    	}
    } );

    jQuery.fn.extend( {
    	detach: function( selector ) {
    		return remove( this, selector, true );
    	},

    	remove: function( selector ) {
    		return remove( this, selector );
    	},

    	text: function( value ) {
    		return access( this, function( value ) {
    			return value === undefined ?
    				jQuery.text( this ) :
    				this.empty().each( function() {
    					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
    						this.textContent = value;
    					}
    				} );
    		}, null, value, arguments.length );
    	},

    	append: function() {
    		return domManip( this, arguments, function( elem ) {
    			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
    				var target = manipulationTarget( this, elem );
    				target.appendChild( elem );
    			}
    		} );
    	},

    	prepend: function() {
    		return domManip( this, arguments, function( elem ) {
    			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
    				var target = manipulationTarget( this, elem );
    				target.insertBefore( elem, target.firstChild );
    			}
    		} );
    	},

    	before: function() {
    		return domManip( this, arguments, function( elem ) {
    			if ( this.parentNode ) {
    				this.parentNode.insertBefore( elem, this );
    			}
    		} );
    	},

    	after: function() {
    		return domManip( this, arguments, function( elem ) {
    			if ( this.parentNode ) {
    				this.parentNode.insertBefore( elem, this.nextSibling );
    			}
    		} );
    	},

    	empty: function() {
    		var elem,
    			i = 0;

    		for ( ; ( elem = this[ i ] ) != null; i++ ) {
    			if ( elem.nodeType === 1 ) {

    				// Prevent memory leaks
    				jQuery.cleanData( getAll( elem, false ) );

    				// Remove any remaining nodes
    				elem.textContent = "";
    			}
    		}

    		return this;
    	},

    	clone: function( dataAndEvents, deepDataAndEvents ) {
    		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
    		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

    		return this.map( function() {
    			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
    		} );
    	},

    	html: function( value ) {
    		return access( this, function( value ) {
    			var elem = this[ 0 ] || {},
    				i = 0,
    				l = this.length;

    			if ( value === undefined && elem.nodeType === 1 ) {
    				return elem.innerHTML;
    			}

    			// See if we can take a shortcut and just use innerHTML
    			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
    				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

    				value = jQuery.htmlPrefilter( value );

    				try {
    					for ( ; i < l; i++ ) {
    						elem = this[ i ] || {};

    						// Remove element nodes and prevent memory leaks
    						if ( elem.nodeType === 1 ) {
    							jQuery.cleanData( getAll( elem, false ) );
    							elem.innerHTML = value;
    						}
    					}

    					elem = 0;

    				// If using innerHTML throws an exception, use the fallback method
    				} catch ( e ) {}
    			}

    			if ( elem ) {
    				this.empty().append( value );
    			}
    		}, null, value, arguments.length );
    	},

    	replaceWith: function() {
    		var ignored = [];

    		// Make the changes, replacing each non-ignored context element with the new content
    		return domManip( this, arguments, function( elem ) {
    			var parent = this.parentNode;

    			if ( jQuery.inArray( this, ignored ) < 0 ) {
    				jQuery.cleanData( getAll( this ) );
    				if ( parent ) {
    					parent.replaceChild( elem, this );
    				}
    			}

    		// Force callback invocation
    		}, ignored );
    	}
    } );

    jQuery.each( {
    	appendTo: "append",
    	prependTo: "prepend",
    	insertBefore: "before",
    	insertAfter: "after",
    	replaceAll: "replaceWith"
    }, function( name, original ) {
    	jQuery.fn[ name ] = function( selector ) {
    		var elems,
    			ret = [],
    			insert = jQuery( selector ),
    			last = insert.length - 1,
    			i = 0;

    		for ( ; i <= last; i++ ) {
    			elems = i === last ? this : this.clone( true );
    			jQuery( insert[ i ] )[ original ]( elems );

    			// Support: Android <=4.0 only, PhantomJS 1 only
    			// .get() because push.apply(_, arraylike) throws on ancient WebKit
    			push.apply( ret, elems.get() );
    		}

    		return this.pushStack( ret );
    	};
    } );
    var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

    var getStyles = function( elem ) {

    		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
    		// IE throws on elements created in popups
    		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
    		var view = elem.ownerDocument.defaultView;

    		if ( !view || !view.opener ) {
    			view = window;
    		}

    		return view.getComputedStyle( elem );
    	};

    var swap = function( elem, options, callback ) {
    	var ret, name,
    		old = {};

    	// Remember the old values, and insert the new ones
    	for ( name in options ) {
    		old[ name ] = elem.style[ name ];
    		elem.style[ name ] = options[ name ];
    	}

    	ret = callback.call( elem );

    	// Revert the old values
    	for ( name in options ) {
    		elem.style[ name ] = old[ name ];
    	}

    	return ret;
    };


    var rboxStyle = new RegExp( cssExpand.join( "|" ), "i" );



    ( function() {

    	// Executing both pixelPosition & boxSizingReliable tests require only one layout
    	// so they're executed at the same time to save the second computation.
    	function computeStyleTests() {

    		// This is a singleton, we need to execute it only once
    		if ( !div ) {
    			return;
    		}

    		container.style.cssText = "position:absolute;left:-11111px;width:60px;" +
    			"margin-top:1px;padding:0;border:0";
    		div.style.cssText =
    			"position:relative;display:block;box-sizing:border-box;overflow:scroll;" +
    			"margin:auto;border:1px;padding:1px;" +
    			"width:60%;top:1%";
    		documentElement.appendChild( container ).appendChild( div );

    		var divStyle = window.getComputedStyle( div );
    		pixelPositionVal = divStyle.top !== "1%";

    		// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
    		reliableMarginLeftVal = roundPixelMeasures( divStyle.marginLeft ) === 12;

    		// Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
    		// Some styles come back with percentage values, even though they shouldn't
    		div.style.right = "60%";
    		pixelBoxStylesVal = roundPixelMeasures( divStyle.right ) === 36;

    		// Support: IE 9 - 11 only
    		// Detect misreporting of content dimensions for box-sizing:border-box elements
    		boxSizingReliableVal = roundPixelMeasures( divStyle.width ) === 36;

    		// Support: IE 9 only
    		// Detect overflow:scroll screwiness (gh-3699)
    		// Support: Chrome <=64
    		// Don't get tricked when zoom affects offsetWidth (gh-4029)
    		div.style.position = "absolute";
    		scrollboxSizeVal = roundPixelMeasures( div.offsetWidth / 3 ) === 12;

    		documentElement.removeChild( container );

    		// Nullify the div so it wouldn't be stored in the memory and
    		// it will also be a sign that checks already performed
    		div = null;
    	}

    	function roundPixelMeasures( measure ) {
    		return Math.round( parseFloat( measure ) );
    	}

    	var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal,
    		reliableTrDimensionsVal, reliableMarginLeftVal,
    		container = document.createElement( "div" ),
    		div = document.createElement( "div" );

    	// Finish early in limited (non-browser) environments
    	if ( !div.style ) {
    		return;
    	}

    	// Support: IE <=9 - 11 only
    	// Style of cloned element affects source element cloned (#8908)
    	div.style.backgroundClip = "content-box";
    	div.cloneNode( true ).style.backgroundClip = "";
    	support.clearCloneStyle = div.style.backgroundClip === "content-box";

    	jQuery.extend( support, {
    		boxSizingReliable: function() {
    			computeStyleTests();
    			return boxSizingReliableVal;
    		},
    		pixelBoxStyles: function() {
    			computeStyleTests();
    			return pixelBoxStylesVal;
    		},
    		pixelPosition: function() {
    			computeStyleTests();
    			return pixelPositionVal;
    		},
    		reliableMarginLeft: function() {
    			computeStyleTests();
    			return reliableMarginLeftVal;
    		},
    		scrollboxSize: function() {
    			computeStyleTests();
    			return scrollboxSizeVal;
    		},

    		// Support: IE 9 - 11+, Edge 15 - 18+
    		// IE/Edge misreport `getComputedStyle` of table rows with width/height
    		// set in CSS while `offset*` properties report correct values.
    		// Behavior in IE 9 is more subtle than in newer versions & it passes
    		// some versions of this test; make sure not to make it pass there!
    		//
    		// Support: Firefox 70+
    		// Only Firefox includes border widths
    		// in computed dimensions. (gh-4529)
    		reliableTrDimensions: function() {
    			var table, tr, trChild, trStyle;
    			if ( reliableTrDimensionsVal == null ) {
    				table = document.createElement( "table" );
    				tr = document.createElement( "tr" );
    				trChild = document.createElement( "div" );

    				table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate";
    				tr.style.cssText = "border:1px solid";

    				// Support: Chrome 86+
    				// Height set through cssText does not get applied.
    				// Computed height then comes back as 0.
    				tr.style.height = "1px";
    				trChild.style.height = "9px";

    				// Support: Android 8 Chrome 86+
    				// In our bodyBackground.html iframe,
    				// display for all div elements is set to "inline",
    				// which causes a problem only in Android 8 Chrome 86.
    				// Ensuring the div is display: block
    				// gets around this issue.
    				trChild.style.display = "block";

    				documentElement
    					.appendChild( table )
    					.appendChild( tr )
    					.appendChild( trChild );

    				trStyle = window.getComputedStyle( tr );
    				reliableTrDimensionsVal = ( parseInt( trStyle.height, 10 ) +
    					parseInt( trStyle.borderTopWidth, 10 ) +
    					parseInt( trStyle.borderBottomWidth, 10 ) ) === tr.offsetHeight;

    				documentElement.removeChild( table );
    			}
    			return reliableTrDimensionsVal;
    		}
    	} );
    } )();


    function curCSS( elem, name, computed ) {
    	var width, minWidth, maxWidth, ret,

    		// Support: Firefox 51+
    		// Retrieving style before computed somehow
    		// fixes an issue with getting wrong values
    		// on detached elements
    		style = elem.style;

    	computed = computed || getStyles( elem );

    	// getPropertyValue is needed for:
    	//   .css('filter') (IE 9 only, #12537)
    	//   .css('--customProperty) (#3144)
    	if ( computed ) {
    		ret = computed.getPropertyValue( name ) || computed[ name ];

    		if ( ret === "" && !isAttached( elem ) ) {
    			ret = jQuery.style( elem, name );
    		}

    		// A tribute to the "awesome hack by Dean Edwards"
    		// Android Browser returns percentage for some values,
    		// but width seems to be reliably pixels.
    		// This is against the CSSOM draft spec:
    		// https://drafts.csswg.org/cssom/#resolved-values
    		if ( !support.pixelBoxStyles() && rnumnonpx.test( ret ) && rboxStyle.test( name ) ) {

    			// Remember the original values
    			width = style.width;
    			minWidth = style.minWidth;
    			maxWidth = style.maxWidth;

    			// Put in the new values to get a computed value out
    			style.minWidth = style.maxWidth = style.width = ret;
    			ret = computed.width;

    			// Revert the changed values
    			style.width = width;
    			style.minWidth = minWidth;
    			style.maxWidth = maxWidth;
    		}
    	}

    	return ret !== undefined ?

    		// Support: IE <=9 - 11 only
    		// IE returns zIndex value as an integer.
    		ret + "" :
    		ret;
    }


    function addGetHookIf( conditionFn, hookFn ) {

    	// Define the hook, we'll check on the first run if it's really needed.
    	return {
    		get: function() {
    			if ( conditionFn() ) {

    				// Hook not needed (or it's not possible to use it due
    				// to missing dependency), remove it.
    				delete this.get;
    				return;
    			}

    			// Hook needed; redefine it so that the support test is not executed again.
    			return ( this.get = hookFn ).apply( this, arguments );
    		}
    	};
    }


    var cssPrefixes = [ "Webkit", "Moz", "ms" ],
    	emptyStyle = document.createElement( "div" ).style,
    	vendorProps = {};

    // Return a vendor-prefixed property or undefined
    function vendorPropName( name ) {

    	// Check for vendor prefixed names
    	var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
    		i = cssPrefixes.length;

    	while ( i-- ) {
    		name = cssPrefixes[ i ] + capName;
    		if ( name in emptyStyle ) {
    			return name;
    		}
    	}
    }

    // Return a potentially-mapped jQuery.cssProps or vendor prefixed property
    function finalPropName( name ) {
    	var final = jQuery.cssProps[ name ] || vendorProps[ name ];

    	if ( final ) {
    		return final;
    	}
    	if ( name in emptyStyle ) {
    		return name;
    	}
    	return vendorProps[ name ] = vendorPropName( name ) || name;
    }


    var

    	// Swappable if display is none or starts with table
    	// except "table", "table-cell", or "table-caption"
    	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
    	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
    	rcustomProp = /^--/,
    	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
    	cssNormalTransform = {
    		letterSpacing: "0",
    		fontWeight: "400"
    	};

    function setPositiveNumber( _elem, value, subtract ) {

    	// Any relative (+/-) values have already been
    	// normalized at this point
    	var matches = rcssNum.exec( value );
    	return matches ?

    		// Guard against undefined "subtract", e.g., when used as in cssHooks
    		Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
    		value;
    }

    function boxModelAdjustment( elem, dimension, box, isBorderBox, styles, computedVal ) {
    	var i = dimension === "width" ? 1 : 0,
    		extra = 0,
    		delta = 0;

    	// Adjustment may not be necessary
    	if ( box === ( isBorderBox ? "border" : "content" ) ) {
    		return 0;
    	}

    	for ( ; i < 4; i += 2 ) {

    		// Both box models exclude margin
    		if ( box === "margin" ) {
    			delta += jQuery.css( elem, box + cssExpand[ i ], true, styles );
    		}

    		// If we get here with a content-box, we're seeking "padding" or "border" or "margin"
    		if ( !isBorderBox ) {

    			// Add padding
    			delta += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

    			// For "border" or "margin", add border
    			if ( box !== "padding" ) {
    				delta += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );

    			// But still keep track of it otherwise
    			} else {
    				extra += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
    			}

    		// If we get here with a border-box (content + padding + border), we're seeking "content" or
    		// "padding" or "margin"
    		} else {

    			// For "content", subtract padding
    			if ( box === "content" ) {
    				delta -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
    			}

    			// For "content" or "padding", subtract border
    			if ( box !== "margin" ) {
    				delta -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
    			}
    		}
    	}

    	// Account for positive content-box scroll gutter when requested by providing computedVal
    	if ( !isBorderBox && computedVal >= 0 ) {

    		// offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
    		// Assuming integer scroll gutter, subtract the rest and round down
    		delta += Math.max( 0, Math.ceil(
    			elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
    			computedVal -
    			delta -
    			extra -
    			0.5

    		// If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
    		// Use an explicit zero to avoid NaN (gh-3964)
    		) ) || 0;
    	}

    	return delta;
    }

    function getWidthOrHeight( elem, dimension, extra ) {

    	// Start with computed style
    	var styles = getStyles( elem ),

    		// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-4322).
    		// Fake content-box until we know it's needed to know the true value.
    		boxSizingNeeded = !support.boxSizingReliable() || extra,
    		isBorderBox = boxSizingNeeded &&
    			jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
    		valueIsBorderBox = isBorderBox,

    		val = curCSS( elem, dimension, styles ),
    		offsetProp = "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 );

    	// Support: Firefox <=54
    	// Return a confounding non-pixel value or feign ignorance, as appropriate.
    	if ( rnumnonpx.test( val ) ) {
    		if ( !extra ) {
    			return val;
    		}
    		val = "auto";
    	}


    	// Support: IE 9 - 11 only
    	// Use offsetWidth/offsetHeight for when box sizing is unreliable.
    	// In those cases, the computed value can be trusted to be border-box.
    	if ( ( !support.boxSizingReliable() && isBorderBox ||

    		// Support: IE 10 - 11+, Edge 15 - 18+
    		// IE/Edge misreport `getComputedStyle` of table rows with width/height
    		// set in CSS while `offset*` properties report correct values.
    		// Interestingly, in some cases IE 9 doesn't suffer from this issue.
    		!support.reliableTrDimensions() && nodeName( elem, "tr" ) ||

    		// Fall back to offsetWidth/offsetHeight when value is "auto"
    		// This happens for inline elements with no explicit setting (gh-3571)
    		val === "auto" ||

    		// Support: Android <=4.1 - 4.3 only
    		// Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
    		!parseFloat( val ) && jQuery.css( elem, "display", false, styles ) === "inline" ) &&

    		// Make sure the element is visible & connected
    		elem.getClientRects().length ) {

    		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

    		// Where available, offsetWidth/offsetHeight approximate border box dimensions.
    		// Where not available (e.g., SVG), assume unreliable box-sizing and interpret the
    		// retrieved value as a content box dimension.
    		valueIsBorderBox = offsetProp in elem;
    		if ( valueIsBorderBox ) {
    			val = elem[ offsetProp ];
    		}
    	}

    	// Normalize "" and auto
    	val = parseFloat( val ) || 0;

    	// Adjust for the element's box model
    	return ( val +
    		boxModelAdjustment(
    			elem,
    			dimension,
    			extra || ( isBorderBox ? "border" : "content" ),
    			valueIsBorderBox,
    			styles,

    			// Provide the current computed size to request scroll gutter calculation (gh-3589)
    			val
    		)
    	) + "px";
    }

    jQuery.extend( {

    	// Add in style property hooks for overriding the default
    	// behavior of getting and setting a style property
    	cssHooks: {
    		opacity: {
    			get: function( elem, computed ) {
    				if ( computed ) {

    					// We should always get a number back from opacity
    					var ret = curCSS( elem, "opacity" );
    					return ret === "" ? "1" : ret;
    				}
    			}
    		}
    	},

    	// Don't automatically add "px" to these possibly-unitless properties
    	cssNumber: {
    		"animationIterationCount": true,
    		"columnCount": true,
    		"fillOpacity": true,
    		"flexGrow": true,
    		"flexShrink": true,
    		"fontWeight": true,
    		"gridArea": true,
    		"gridColumn": true,
    		"gridColumnEnd": true,
    		"gridColumnStart": true,
    		"gridRow": true,
    		"gridRowEnd": true,
    		"gridRowStart": true,
    		"lineHeight": true,
    		"opacity": true,
    		"order": true,
    		"orphans": true,
    		"widows": true,
    		"zIndex": true,
    		"zoom": true
    	},

    	// Add in properties whose names you wish to fix before
    	// setting or getting the value
    	cssProps: {},

    	// Get and set the style property on a DOM Node
    	style: function( elem, name, value, extra ) {

    		// Don't set styles on text and comment nodes
    		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
    			return;
    		}

    		// Make sure that we're working with the right name
    		var ret, type, hooks,
    			origName = camelCase( name ),
    			isCustomProp = rcustomProp.test( name ),
    			style = elem.style;

    		// Make sure that we're working with the right name. We don't
    		// want to query the value if it is a CSS custom property
    		// since they are user-defined.
    		if ( !isCustomProp ) {
    			name = finalPropName( origName );
    		}

    		// Gets hook for the prefixed version, then unprefixed version
    		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

    		// Check if we're setting a value
    		if ( value !== undefined ) {
    			type = typeof value;

    			// Convert "+=" or "-=" to relative numbers (#7345)
    			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
    				value = adjustCSS( elem, name, ret );

    				// Fixes bug #9237
    				type = "number";
    			}

    			// Make sure that null and NaN values aren't set (#7116)
    			if ( value == null || value !== value ) {
    				return;
    			}

    			// If a number was passed in, add the unit (except for certain CSS properties)
    			// The isCustomProp check can be removed in jQuery 4.0 when we only auto-append
    			// "px" to a few hardcoded values.
    			if ( type === "number" && !isCustomProp ) {
    				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
    			}

    			// background-* props affect original clone's values
    			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
    				style[ name ] = "inherit";
    			}

    			// If a hook was provided, use that value, otherwise just set the specified value
    			if ( !hooks || !( "set" in hooks ) ||
    				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

    				if ( isCustomProp ) {
    					style.setProperty( name, value );
    				} else {
    					style[ name ] = value;
    				}
    			}

    		} else {

    			// If a hook was provided get the non-computed value from there
    			if ( hooks && "get" in hooks &&
    				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

    				return ret;
    			}

    			// Otherwise just get the value from the style object
    			return style[ name ];
    		}
    	},

    	css: function( elem, name, extra, styles ) {
    		var val, num, hooks,
    			origName = camelCase( name ),
    			isCustomProp = rcustomProp.test( name );

    		// Make sure that we're working with the right name. We don't
    		// want to modify the value if it is a CSS custom property
    		// since they are user-defined.
    		if ( !isCustomProp ) {
    			name = finalPropName( origName );
    		}

    		// Try prefixed name followed by the unprefixed name
    		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

    		// If a hook was provided get the computed value from there
    		if ( hooks && "get" in hooks ) {
    			val = hooks.get( elem, true, extra );
    		}

    		// Otherwise, if a way to get the computed value exists, use that
    		if ( val === undefined ) {
    			val = curCSS( elem, name, styles );
    		}

    		// Convert "normal" to computed value
    		if ( val === "normal" && name in cssNormalTransform ) {
    			val = cssNormalTransform[ name ];
    		}

    		// Make numeric if forced or a qualifier was provided and val looks numeric
    		if ( extra === "" || extra ) {
    			num = parseFloat( val );
    			return extra === true || isFinite( num ) ? num || 0 : val;
    		}

    		return val;
    	}
    } );

    jQuery.each( [ "height", "width" ], function( _i, dimension ) {
    	jQuery.cssHooks[ dimension ] = {
    		get: function( elem, computed, extra ) {
    			if ( computed ) {

    				// Certain elements can have dimension info if we invisibly show them
    				// but it must have a current display style that would benefit
    				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

    					// Support: Safari 8+
    					// Table columns in Safari have non-zero offsetWidth & zero
    					// getBoundingClientRect().width unless display is changed.
    					// Support: IE <=11 only
    					// Running getBoundingClientRect on a disconnected node
    					// in IE throws an error.
    					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
    					swap( elem, cssShow, function() {
    						return getWidthOrHeight( elem, dimension, extra );
    					} ) :
    					getWidthOrHeight( elem, dimension, extra );
    			}
    		},

    		set: function( elem, value, extra ) {
    			var matches,
    				styles = getStyles( elem ),

    				// Only read styles.position if the test has a chance to fail
    				// to avoid forcing a reflow.
    				scrollboxSizeBuggy = !support.scrollboxSize() &&
    					styles.position === "absolute",

    				// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-3991)
    				boxSizingNeeded = scrollboxSizeBuggy || extra,
    				isBorderBox = boxSizingNeeded &&
    					jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
    				subtract = extra ?
    					boxModelAdjustment(
    						elem,
    						dimension,
    						extra,
    						isBorderBox,
    						styles
    					) :
    					0;

    			// Account for unreliable border-box dimensions by comparing offset* to computed and
    			// faking a content-box to get border and padding (gh-3699)
    			if ( isBorderBox && scrollboxSizeBuggy ) {
    				subtract -= Math.ceil(
    					elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
    					parseFloat( styles[ dimension ] ) -
    					boxModelAdjustment( elem, dimension, "border", false, styles ) -
    					0.5
    				);
    			}

    			// Convert to pixels if value adjustment is needed
    			if ( subtract && ( matches = rcssNum.exec( value ) ) &&
    				( matches[ 3 ] || "px" ) !== "px" ) {

    				elem.style[ dimension ] = value;
    				value = jQuery.css( elem, dimension );
    			}

    			return setPositiveNumber( elem, value, subtract );
    		}
    	};
    } );

    jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
    	function( elem, computed ) {
    		if ( computed ) {
    			return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
    				elem.getBoundingClientRect().left -
    					swap( elem, { marginLeft: 0 }, function() {
    						return elem.getBoundingClientRect().left;
    					} )
    			) + "px";
    		}
    	}
    );

    // These hooks are used by animate to expand properties
    jQuery.each( {
    	margin: "",
    	padding: "",
    	border: "Width"
    }, function( prefix, suffix ) {
    	jQuery.cssHooks[ prefix + suffix ] = {
    		expand: function( value ) {
    			var i = 0,
    				expanded = {},

    				// Assumes a single number if not a string
    				parts = typeof value === "string" ? value.split( " " ) : [ value ];

    			for ( ; i < 4; i++ ) {
    				expanded[ prefix + cssExpand[ i ] + suffix ] =
    					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
    			}

    			return expanded;
    		}
    	};

    	if ( prefix !== "margin" ) {
    		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
    	}
    } );

    jQuery.fn.extend( {
    	css: function( name, value ) {
    		return access( this, function( elem, name, value ) {
    			var styles, len,
    				map = {},
    				i = 0;

    			if ( Array.isArray( name ) ) {
    				styles = getStyles( elem );
    				len = name.length;

    				for ( ; i < len; i++ ) {
    					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
    				}

    				return map;
    			}

    			return value !== undefined ?
    				jQuery.style( elem, name, value ) :
    				jQuery.css( elem, name );
    		}, name, value, arguments.length > 1 );
    	}
    } );


    function Tween( elem, options, prop, end, easing ) {
    	return new Tween.prototype.init( elem, options, prop, end, easing );
    }
    jQuery.Tween = Tween;

    Tween.prototype = {
    	constructor: Tween,
    	init: function( elem, options, prop, end, easing, unit ) {
    		this.elem = elem;
    		this.prop = prop;
    		this.easing = easing || jQuery.easing._default;
    		this.options = options;
    		this.start = this.now = this.cur();
    		this.end = end;
    		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
    	},
    	cur: function() {
    		var hooks = Tween.propHooks[ this.prop ];

    		return hooks && hooks.get ?
    			hooks.get( this ) :
    			Tween.propHooks._default.get( this );
    	},
    	run: function( percent ) {
    		var eased,
    			hooks = Tween.propHooks[ this.prop ];

    		if ( this.options.duration ) {
    			this.pos = eased = jQuery.easing[ this.easing ](
    				percent, this.options.duration * percent, 0, 1, this.options.duration
    			);
    		} else {
    			this.pos = eased = percent;
    		}
    		this.now = ( this.end - this.start ) * eased + this.start;

    		if ( this.options.step ) {
    			this.options.step.call( this.elem, this.now, this );
    		}

    		if ( hooks && hooks.set ) {
    			hooks.set( this );
    		} else {
    			Tween.propHooks._default.set( this );
    		}
    		return this;
    	}
    };

    Tween.prototype.init.prototype = Tween.prototype;

    Tween.propHooks = {
    	_default: {
    		get: function( tween ) {
    			var result;

    			// Use a property on the element directly when it is not a DOM element,
    			// or when there is no matching style property that exists.
    			if ( tween.elem.nodeType !== 1 ||
    				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
    				return tween.elem[ tween.prop ];
    			}

    			// Passing an empty string as a 3rd parameter to .css will automatically
    			// attempt a parseFloat and fallback to a string if the parse fails.
    			// Simple values such as "10px" are parsed to Float;
    			// complex values such as "rotate(1rad)" are returned as-is.
    			result = jQuery.css( tween.elem, tween.prop, "" );

    			// Empty strings, null, undefined and "auto" are converted to 0.
    			return !result || result === "auto" ? 0 : result;
    		},
    		set: function( tween ) {

    			// Use step hook for back compat.
    			// Use cssHook if its there.
    			// Use .style if available and use plain properties where available.
    			if ( jQuery.fx.step[ tween.prop ] ) {
    				jQuery.fx.step[ tween.prop ]( tween );
    			} else if ( tween.elem.nodeType === 1 && (
    				jQuery.cssHooks[ tween.prop ] ||
    					tween.elem.style[ finalPropName( tween.prop ) ] != null ) ) {
    				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
    			} else {
    				tween.elem[ tween.prop ] = tween.now;
    			}
    		}
    	}
    };

    // Support: IE <=9 only
    // Panic based approach to setting things on disconnected nodes
    Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
    	set: function( tween ) {
    		if ( tween.elem.nodeType && tween.elem.parentNode ) {
    			tween.elem[ tween.prop ] = tween.now;
    		}
    	}
    };

    jQuery.easing = {
    	linear: function( p ) {
    		return p;
    	},
    	swing: function( p ) {
    		return 0.5 - Math.cos( p * Math.PI ) / 2;
    	},
    	_default: "swing"
    };

    jQuery.fx = Tween.prototype.init;

    // Back compat <1.8 extension point
    jQuery.fx.step = {};




    var
    	fxNow, inProgress,
    	rfxtypes = /^(?:toggle|show|hide)$/,
    	rrun = /queueHooks$/;

    function schedule() {
    	if ( inProgress ) {
    		if ( document.hidden === false && window.requestAnimationFrame ) {
    			window.requestAnimationFrame( schedule );
    		} else {
    			window.setTimeout( schedule, jQuery.fx.interval );
    		}

    		jQuery.fx.tick();
    	}
    }

    // Animations created synchronously will run synchronously
    function createFxNow() {
    	window.setTimeout( function() {
    		fxNow = undefined;
    	} );
    	return ( fxNow = Date.now() );
    }

    // Generate parameters to create a standard animation
    function genFx( type, includeWidth ) {
    	var which,
    		i = 0,
    		attrs = { height: type };

    	// If we include width, step value is 1 to do all cssExpand values,
    	// otherwise step value is 2 to skip over Left and Right
    	includeWidth = includeWidth ? 1 : 0;
    	for ( ; i < 4; i += 2 - includeWidth ) {
    		which = cssExpand[ i ];
    		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
    	}

    	if ( includeWidth ) {
    		attrs.opacity = attrs.width = type;
    	}

    	return attrs;
    }

    function createTween( value, prop, animation ) {
    	var tween,
    		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
    		index = 0,
    		length = collection.length;
    	for ( ; index < length; index++ ) {
    		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

    			// We're done with this property
    			return tween;
    		}
    	}
    }

    function defaultPrefilter( elem, props, opts ) {
    	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
    		isBox = "width" in props || "height" in props,
    		anim = this,
    		orig = {},
    		style = elem.style,
    		hidden = elem.nodeType && isHiddenWithinTree( elem ),
    		dataShow = dataPriv.get( elem, "fxshow" );

    	// Queue-skipping animations hijack the fx hooks
    	if ( !opts.queue ) {
    		hooks = jQuery._queueHooks( elem, "fx" );
    		if ( hooks.unqueued == null ) {
    			hooks.unqueued = 0;
    			oldfire = hooks.empty.fire;
    			hooks.empty.fire = function() {
    				if ( !hooks.unqueued ) {
    					oldfire();
    				}
    			};
    		}
    		hooks.unqueued++;

    		anim.always( function() {

    			// Ensure the complete handler is called before this completes
    			anim.always( function() {
    				hooks.unqueued--;
    				if ( !jQuery.queue( elem, "fx" ).length ) {
    					hooks.empty.fire();
    				}
    			} );
    		} );
    	}

    	// Detect show/hide animations
    	for ( prop in props ) {
    		value = props[ prop ];
    		if ( rfxtypes.test( value ) ) {
    			delete props[ prop ];
    			toggle = toggle || value === "toggle";
    			if ( value === ( hidden ? "hide" : "show" ) ) {

    				// Pretend to be hidden if this is a "show" and
    				// there is still data from a stopped show/hide
    				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
    					hidden = true;

    				// Ignore all other no-op show/hide data
    				} else {
    					continue;
    				}
    			}
    			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
    		}
    	}

    	// Bail out if this is a no-op like .hide().hide()
    	propTween = !jQuery.isEmptyObject( props );
    	if ( !propTween && jQuery.isEmptyObject( orig ) ) {
    		return;
    	}

    	// Restrict "overflow" and "display" styles during box animations
    	if ( isBox && elem.nodeType === 1 ) {

    		// Support: IE <=9 - 11, Edge 12 - 15
    		// Record all 3 overflow attributes because IE does not infer the shorthand
    		// from identically-valued overflowX and overflowY and Edge just mirrors
    		// the overflowX value there.
    		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

    		// Identify a display type, preferring old show/hide data over the CSS cascade
    		restoreDisplay = dataShow && dataShow.display;
    		if ( restoreDisplay == null ) {
    			restoreDisplay = dataPriv.get( elem, "display" );
    		}
    		display = jQuery.css( elem, "display" );
    		if ( display === "none" ) {
    			if ( restoreDisplay ) {
    				display = restoreDisplay;
    			} else {

    				// Get nonempty value(s) by temporarily forcing visibility
    				showHide( [ elem ], true );
    				restoreDisplay = elem.style.display || restoreDisplay;
    				display = jQuery.css( elem, "display" );
    				showHide( [ elem ] );
    			}
    		}

    		// Animate inline elements as inline-block
    		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
    			if ( jQuery.css( elem, "float" ) === "none" ) {

    				// Restore the original display value at the end of pure show/hide animations
    				if ( !propTween ) {
    					anim.done( function() {
    						style.display = restoreDisplay;
    					} );
    					if ( restoreDisplay == null ) {
    						display = style.display;
    						restoreDisplay = display === "none" ? "" : display;
    					}
    				}
    				style.display = "inline-block";
    			}
    		}
    	}

    	if ( opts.overflow ) {
    		style.overflow = "hidden";
    		anim.always( function() {
    			style.overflow = opts.overflow[ 0 ];
    			style.overflowX = opts.overflow[ 1 ];
    			style.overflowY = opts.overflow[ 2 ];
    		} );
    	}

    	// Implement show/hide animations
    	propTween = false;
    	for ( prop in orig ) {

    		// General show/hide setup for this element animation
    		if ( !propTween ) {
    			if ( dataShow ) {
    				if ( "hidden" in dataShow ) {
    					hidden = dataShow.hidden;
    				}
    			} else {
    				dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
    			}

    			// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
    			if ( toggle ) {
    				dataShow.hidden = !hidden;
    			}

    			// Show elements before animating them
    			if ( hidden ) {
    				showHide( [ elem ], true );
    			}

    			/* eslint-disable no-loop-func */

    			anim.done( function() {

    				/* eslint-enable no-loop-func */

    				// The final step of a "hide" animation is actually hiding the element
    				if ( !hidden ) {
    					showHide( [ elem ] );
    				}
    				dataPriv.remove( elem, "fxshow" );
    				for ( prop in orig ) {
    					jQuery.style( elem, prop, orig[ prop ] );
    				}
    			} );
    		}

    		// Per-property setup
    		propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
    		if ( !( prop in dataShow ) ) {
    			dataShow[ prop ] = propTween.start;
    			if ( hidden ) {
    				propTween.end = propTween.start;
    				propTween.start = 0;
    			}
    		}
    	}
    }

    function propFilter( props, specialEasing ) {
    	var index, name, easing, value, hooks;

    	// camelCase, specialEasing and expand cssHook pass
    	for ( index in props ) {
    		name = camelCase( index );
    		easing = specialEasing[ name ];
    		value = props[ index ];
    		if ( Array.isArray( value ) ) {
    			easing = value[ 1 ];
    			value = props[ index ] = value[ 0 ];
    		}

    		if ( index !== name ) {
    			props[ name ] = value;
    			delete props[ index ];
    		}

    		hooks = jQuery.cssHooks[ name ];
    		if ( hooks && "expand" in hooks ) {
    			value = hooks.expand( value );
    			delete props[ name ];

    			// Not quite $.extend, this won't overwrite existing keys.
    			// Reusing 'index' because we have the correct "name"
    			for ( index in value ) {
    				if ( !( index in props ) ) {
    					props[ index ] = value[ index ];
    					specialEasing[ index ] = easing;
    				}
    			}
    		} else {
    			specialEasing[ name ] = easing;
    		}
    	}
    }

    function Animation( elem, properties, options ) {
    	var result,
    		stopped,
    		index = 0,
    		length = Animation.prefilters.length,
    		deferred = jQuery.Deferred().always( function() {

    			// Don't match elem in the :animated selector
    			delete tick.elem;
    		} ),
    		tick = function() {
    			if ( stopped ) {
    				return false;
    			}
    			var currentTime = fxNow || createFxNow(),
    				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

    				// Support: Android 2.3 only
    				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
    				temp = remaining / animation.duration || 0,
    				percent = 1 - temp,
    				index = 0,
    				length = animation.tweens.length;

    			for ( ; index < length; index++ ) {
    				animation.tweens[ index ].run( percent );
    			}

    			deferred.notifyWith( elem, [ animation, percent, remaining ] );

    			// If there's more to do, yield
    			if ( percent < 1 && length ) {
    				return remaining;
    			}

    			// If this was an empty animation, synthesize a final progress notification
    			if ( !length ) {
    				deferred.notifyWith( elem, [ animation, 1, 0 ] );
    			}

    			// Resolve the animation and report its conclusion
    			deferred.resolveWith( elem, [ animation ] );
    			return false;
    		},
    		animation = deferred.promise( {
    			elem: elem,
    			props: jQuery.extend( {}, properties ),
    			opts: jQuery.extend( true, {
    				specialEasing: {},
    				easing: jQuery.easing._default
    			}, options ),
    			originalProperties: properties,
    			originalOptions: options,
    			startTime: fxNow || createFxNow(),
    			duration: options.duration,
    			tweens: [],
    			createTween: function( prop, end ) {
    				var tween = jQuery.Tween( elem, animation.opts, prop, end,
    					animation.opts.specialEasing[ prop ] || animation.opts.easing );
    				animation.tweens.push( tween );
    				return tween;
    			},
    			stop: function( gotoEnd ) {
    				var index = 0,

    					// If we are going to the end, we want to run all the tweens
    					// otherwise we skip this part
    					length = gotoEnd ? animation.tweens.length : 0;
    				if ( stopped ) {
    					return this;
    				}
    				stopped = true;
    				for ( ; index < length; index++ ) {
    					animation.tweens[ index ].run( 1 );
    				}

    				// Resolve when we played the last frame; otherwise, reject
    				if ( gotoEnd ) {
    					deferred.notifyWith( elem, [ animation, 1, 0 ] );
    					deferred.resolveWith( elem, [ animation, gotoEnd ] );
    				} else {
    					deferred.rejectWith( elem, [ animation, gotoEnd ] );
    				}
    				return this;
    			}
    		} ),
    		props = animation.props;

    	propFilter( props, animation.opts.specialEasing );

    	for ( ; index < length; index++ ) {
    		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
    		if ( result ) {
    			if ( isFunction( result.stop ) ) {
    				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
    					result.stop.bind( result );
    			}
    			return result;
    		}
    	}

    	jQuery.map( props, createTween, animation );

    	if ( isFunction( animation.opts.start ) ) {
    		animation.opts.start.call( elem, animation );
    	}

    	// Attach callbacks from options
    	animation
    		.progress( animation.opts.progress )
    		.done( animation.opts.done, animation.opts.complete )
    		.fail( animation.opts.fail )
    		.always( animation.opts.always );

    	jQuery.fx.timer(
    		jQuery.extend( tick, {
    			elem: elem,
    			anim: animation,
    			queue: animation.opts.queue
    		} )
    	);

    	return animation;
    }

    jQuery.Animation = jQuery.extend( Animation, {

    	tweeners: {
    		"*": [ function( prop, value ) {
    			var tween = this.createTween( prop, value );
    			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
    			return tween;
    		} ]
    	},

    	tweener: function( props, callback ) {
    		if ( isFunction( props ) ) {
    			callback = props;
    			props = [ "*" ];
    		} else {
    			props = props.match( rnothtmlwhite );
    		}

    		var prop,
    			index = 0,
    			length = props.length;

    		for ( ; index < length; index++ ) {
    			prop = props[ index ];
    			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
    			Animation.tweeners[ prop ].unshift( callback );
    		}
    	},

    	prefilters: [ defaultPrefilter ],

    	prefilter: function( callback, prepend ) {
    		if ( prepend ) {
    			Animation.prefilters.unshift( callback );
    		} else {
    			Animation.prefilters.push( callback );
    		}
    	}
    } );

    jQuery.speed = function( speed, easing, fn ) {
    	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
    		complete: fn || !fn && easing ||
    			isFunction( speed ) && speed,
    		duration: speed,
    		easing: fn && easing || easing && !isFunction( easing ) && easing
    	};

    	// Go to the end state if fx are off
    	if ( jQuery.fx.off ) {
    		opt.duration = 0;

    	} else {
    		if ( typeof opt.duration !== "number" ) {
    			if ( opt.duration in jQuery.fx.speeds ) {
    				opt.duration = jQuery.fx.speeds[ opt.duration ];

    			} else {
    				opt.duration = jQuery.fx.speeds._default;
    			}
    		}
    	}

    	// Normalize opt.queue - true/undefined/null -> "fx"
    	if ( opt.queue == null || opt.queue === true ) {
    		opt.queue = "fx";
    	}

    	// Queueing
    	opt.old = opt.complete;

    	opt.complete = function() {
    		if ( isFunction( opt.old ) ) {
    			opt.old.call( this );
    		}

    		if ( opt.queue ) {
    			jQuery.dequeue( this, opt.queue );
    		}
    	};

    	return opt;
    };

    jQuery.fn.extend( {
    	fadeTo: function( speed, to, easing, callback ) {

    		// Show any hidden elements after setting opacity to 0
    		return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

    			// Animate to the value specified
    			.end().animate( { opacity: to }, speed, easing, callback );
    	},
    	animate: function( prop, speed, easing, callback ) {
    		var empty = jQuery.isEmptyObject( prop ),
    			optall = jQuery.speed( speed, easing, callback ),
    			doAnimation = function() {

    				// Operate on a copy of prop so per-property easing won't be lost
    				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

    				// Empty animations, or finishing resolves immediately
    				if ( empty || dataPriv.get( this, "finish" ) ) {
    					anim.stop( true );
    				}
    			};

    		doAnimation.finish = doAnimation;

    		return empty || optall.queue === false ?
    			this.each( doAnimation ) :
    			this.queue( optall.queue, doAnimation );
    	},
    	stop: function( type, clearQueue, gotoEnd ) {
    		var stopQueue = function( hooks ) {
    			var stop = hooks.stop;
    			delete hooks.stop;
    			stop( gotoEnd );
    		};

    		if ( typeof type !== "string" ) {
    			gotoEnd = clearQueue;
    			clearQueue = type;
    			type = undefined;
    		}
    		if ( clearQueue ) {
    			this.queue( type || "fx", [] );
    		}

    		return this.each( function() {
    			var dequeue = true,
    				index = type != null && type + "queueHooks",
    				timers = jQuery.timers,
    				data = dataPriv.get( this );

    			if ( index ) {
    				if ( data[ index ] && data[ index ].stop ) {
    					stopQueue( data[ index ] );
    				}
    			} else {
    				for ( index in data ) {
    					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
    						stopQueue( data[ index ] );
    					}
    				}
    			}

    			for ( index = timers.length; index--; ) {
    				if ( timers[ index ].elem === this &&
    					( type == null || timers[ index ].queue === type ) ) {

    					timers[ index ].anim.stop( gotoEnd );
    					dequeue = false;
    					timers.splice( index, 1 );
    				}
    			}

    			// Start the next in the queue if the last step wasn't forced.
    			// Timers currently will call their complete callbacks, which
    			// will dequeue but only if they were gotoEnd.
    			if ( dequeue || !gotoEnd ) {
    				jQuery.dequeue( this, type );
    			}
    		} );
    	},
    	finish: function( type ) {
    		if ( type !== false ) {
    			type = type || "fx";
    		}
    		return this.each( function() {
    			var index,
    				data = dataPriv.get( this ),
    				queue = data[ type + "queue" ],
    				hooks = data[ type + "queueHooks" ],
    				timers = jQuery.timers,
    				length = queue ? queue.length : 0;

    			// Enable finishing flag on private data
    			data.finish = true;

    			// Empty the queue first
    			jQuery.queue( this, type, [] );

    			if ( hooks && hooks.stop ) {
    				hooks.stop.call( this, true );
    			}

    			// Look for any active animations, and finish them
    			for ( index = timers.length; index--; ) {
    				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
    					timers[ index ].anim.stop( true );
    					timers.splice( index, 1 );
    				}
    			}

    			// Look for any animations in the old queue and finish them
    			for ( index = 0; index < length; index++ ) {
    				if ( queue[ index ] && queue[ index ].finish ) {
    					queue[ index ].finish.call( this );
    				}
    			}

    			// Turn off finishing flag
    			delete data.finish;
    		} );
    	}
    } );

    jQuery.each( [ "toggle", "show", "hide" ], function( _i, name ) {
    	var cssFn = jQuery.fn[ name ];
    	jQuery.fn[ name ] = function( speed, easing, callback ) {
    		return speed == null || typeof speed === "boolean" ?
    			cssFn.apply( this, arguments ) :
    			this.animate( genFx( name, true ), speed, easing, callback );
    	};
    } );

    // Generate shortcuts for custom animations
    jQuery.each( {
    	slideDown: genFx( "show" ),
    	slideUp: genFx( "hide" ),
    	slideToggle: genFx( "toggle" ),
    	fadeIn: { opacity: "show" },
    	fadeOut: { opacity: "hide" },
    	fadeToggle: { opacity: "toggle" }
    }, function( name, props ) {
    	jQuery.fn[ name ] = function( speed, easing, callback ) {
    		return this.animate( props, speed, easing, callback );
    	};
    } );

    jQuery.timers = [];
    jQuery.fx.tick = function() {
    	var timer,
    		i = 0,
    		timers = jQuery.timers;

    	fxNow = Date.now();

    	for ( ; i < timers.length; i++ ) {
    		timer = timers[ i ];

    		// Run the timer and safely remove it when done (allowing for external removal)
    		if ( !timer() && timers[ i ] === timer ) {
    			timers.splice( i--, 1 );
    		}
    	}

    	if ( !timers.length ) {
    		jQuery.fx.stop();
    	}
    	fxNow = undefined;
    };

    jQuery.fx.timer = function( timer ) {
    	jQuery.timers.push( timer );
    	jQuery.fx.start();
    };

    jQuery.fx.interval = 13;
    jQuery.fx.start = function() {
    	if ( inProgress ) {
    		return;
    	}

    	inProgress = true;
    	schedule();
    };

    jQuery.fx.stop = function() {
    	inProgress = null;
    };

    jQuery.fx.speeds = {
    	slow: 600,
    	fast: 200,

    	// Default speed
    	_default: 400
    };


    // Based off of the plugin by Clint Helfers, with permission.
    // https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
    jQuery.fn.delay = function( time, type ) {
    	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
    	type = type || "fx";

    	return this.queue( type, function( next, hooks ) {
    		var timeout = window.setTimeout( next, time );
    		hooks.stop = function() {
    			window.clearTimeout( timeout );
    		};
    	} );
    };


    ( function() {
    	var input = document.createElement( "input" ),
    		select = document.createElement( "select" ),
    		opt = select.appendChild( document.createElement( "option" ) );

    	input.type = "checkbox";

    	// Support: Android <=4.3 only
    	// Default value for a checkbox should be "on"
    	support.checkOn = input.value !== "";

    	// Support: IE <=11 only
    	// Must access selectedIndex to make default options select
    	support.optSelected = opt.selected;

    	// Support: IE <=11 only
    	// An input loses its value after becoming a radio
    	input = document.createElement( "input" );
    	input.value = "t";
    	input.type = "radio";
    	support.radioValue = input.value === "t";
    } )();


    var boolHook,
    	attrHandle = jQuery.expr.attrHandle;

    jQuery.fn.extend( {
    	attr: function( name, value ) {
    		return access( this, jQuery.attr, name, value, arguments.length > 1 );
    	},

    	removeAttr: function( name ) {
    		return this.each( function() {
    			jQuery.removeAttr( this, name );
    		} );
    	}
    } );

    jQuery.extend( {
    	attr: function( elem, name, value ) {
    		var ret, hooks,
    			nType = elem.nodeType;

    		// Don't get/set attributes on text, comment and attribute nodes
    		if ( nType === 3 || nType === 8 || nType === 2 ) {
    			return;
    		}

    		// Fallback to prop when attributes are not supported
    		if ( typeof elem.getAttribute === "undefined" ) {
    			return jQuery.prop( elem, name, value );
    		}

    		// Attribute hooks are determined by the lowercase version
    		// Grab necessary hook if one is defined
    		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
    			hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
    				( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
    		}

    		if ( value !== undefined ) {
    			if ( value === null ) {
    				jQuery.removeAttr( elem, name );
    				return;
    			}

    			if ( hooks && "set" in hooks &&
    				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
    				return ret;
    			}

    			elem.setAttribute( name, value + "" );
    			return value;
    		}

    		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
    			return ret;
    		}

    		ret = jQuery.find.attr( elem, name );

    		// Non-existent attributes return null, we normalize to undefined
    		return ret == null ? undefined : ret;
    	},

    	attrHooks: {
    		type: {
    			set: function( elem, value ) {
    				if ( !support.radioValue && value === "radio" &&
    					nodeName( elem, "input" ) ) {
    					var val = elem.value;
    					elem.setAttribute( "type", value );
    					if ( val ) {
    						elem.value = val;
    					}
    					return value;
    				}
    			}
    		}
    	},

    	removeAttr: function( elem, value ) {
    		var name,
    			i = 0,

    			// Attribute names can contain non-HTML whitespace characters
    			// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
    			attrNames = value && value.match( rnothtmlwhite );

    		if ( attrNames && elem.nodeType === 1 ) {
    			while ( ( name = attrNames[ i++ ] ) ) {
    				elem.removeAttribute( name );
    			}
    		}
    	}
    } );

    // Hooks for boolean attributes
    boolHook = {
    	set: function( elem, value, name ) {
    		if ( value === false ) {

    			// Remove boolean attributes when set to false
    			jQuery.removeAttr( elem, name );
    		} else {
    			elem.setAttribute( name, name );
    		}
    		return name;
    	}
    };

    jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( _i, name ) {
    	var getter = attrHandle[ name ] || jQuery.find.attr;

    	attrHandle[ name ] = function( elem, name, isXML ) {
    		var ret, handle,
    			lowercaseName = name.toLowerCase();

    		if ( !isXML ) {

    			// Avoid an infinite loop by temporarily removing this function from the getter
    			handle = attrHandle[ lowercaseName ];
    			attrHandle[ lowercaseName ] = ret;
    			ret = getter( elem, name, isXML ) != null ?
    				lowercaseName :
    				null;
    			attrHandle[ lowercaseName ] = handle;
    		}
    		return ret;
    	};
    } );




    var rfocusable = /^(?:input|select|textarea|button)$/i,
    	rclickable = /^(?:a|area)$/i;

    jQuery.fn.extend( {
    	prop: function( name, value ) {
    		return access( this, jQuery.prop, name, value, arguments.length > 1 );
    	},

    	removeProp: function( name ) {
    		return this.each( function() {
    			delete this[ jQuery.propFix[ name ] || name ];
    		} );
    	}
    } );

    jQuery.extend( {
    	prop: function( elem, name, value ) {
    		var ret, hooks,
    			nType = elem.nodeType;

    		// Don't get/set properties on text, comment and attribute nodes
    		if ( nType === 3 || nType === 8 || nType === 2 ) {
    			return;
    		}

    		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

    			// Fix name and attach hooks
    			name = jQuery.propFix[ name ] || name;
    			hooks = jQuery.propHooks[ name ];
    		}

    		if ( value !== undefined ) {
    			if ( hooks && "set" in hooks &&
    				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
    				return ret;
    			}

    			return ( elem[ name ] = value );
    		}

    		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
    			return ret;
    		}

    		return elem[ name ];
    	},

    	propHooks: {
    		tabIndex: {
    			get: function( elem ) {

    				// Support: IE <=9 - 11 only
    				// elem.tabIndex doesn't always return the
    				// correct value when it hasn't been explicitly set
    				// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
    				// Use proper attribute retrieval(#12072)
    				var tabindex = jQuery.find.attr( elem, "tabindex" );

    				if ( tabindex ) {
    					return parseInt( tabindex, 10 );
    				}

    				if (
    					rfocusable.test( elem.nodeName ) ||
    					rclickable.test( elem.nodeName ) &&
    					elem.href
    				) {
    					return 0;
    				}

    				return -1;
    			}
    		}
    	},

    	propFix: {
    		"for": "htmlFor",
    		"class": "className"
    	}
    } );

    // Support: IE <=11 only
    // Accessing the selectedIndex property
    // forces the browser to respect setting selected
    // on the option
    // The getter ensures a default option is selected
    // when in an optgroup
    // eslint rule "no-unused-expressions" is disabled for this code
    // since it considers such accessions noop
    if ( !support.optSelected ) {
    	jQuery.propHooks.selected = {
    		get: function( elem ) {

    			/* eslint no-unused-expressions: "off" */

    			var parent = elem.parentNode;
    			if ( parent && parent.parentNode ) {
    				parent.parentNode.selectedIndex;
    			}
    			return null;
    		},
    		set: function( elem ) {

    			/* eslint no-unused-expressions: "off" */

    			var parent = elem.parentNode;
    			if ( parent ) {
    				parent.selectedIndex;

    				if ( parent.parentNode ) {
    					parent.parentNode.selectedIndex;
    				}
    			}
    		}
    	};
    }

    jQuery.each( [
    	"tabIndex",
    	"readOnly",
    	"maxLength",
    	"cellSpacing",
    	"cellPadding",
    	"rowSpan",
    	"colSpan",
    	"useMap",
    	"frameBorder",
    	"contentEditable"
    ], function() {
    	jQuery.propFix[ this.toLowerCase() ] = this;
    } );




    	// Strip and collapse whitespace according to HTML spec
    	// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
    	function stripAndCollapse( value ) {
    		var tokens = value.match( rnothtmlwhite ) || [];
    		return tokens.join( " " );
    	}


    function getClass( elem ) {
    	return elem.getAttribute && elem.getAttribute( "class" ) || "";
    }

    function classesToArray( value ) {
    	if ( Array.isArray( value ) ) {
    		return value;
    	}
    	if ( typeof value === "string" ) {
    		return value.match( rnothtmlwhite ) || [];
    	}
    	return [];
    }

    jQuery.fn.extend( {
    	addClass: function( value ) {
    		var classes, elem, cur, curValue, clazz, j, finalValue,
    			i = 0;

    		if ( isFunction( value ) ) {
    			return this.each( function( j ) {
    				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
    			} );
    		}

    		classes = classesToArray( value );

    		if ( classes.length ) {
    			while ( ( elem = this[ i++ ] ) ) {
    				curValue = getClass( elem );
    				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

    				if ( cur ) {
    					j = 0;
    					while ( ( clazz = classes[ j++ ] ) ) {
    						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
    							cur += clazz + " ";
    						}
    					}

    					// Only assign if different to avoid unneeded rendering.
    					finalValue = stripAndCollapse( cur );
    					if ( curValue !== finalValue ) {
    						elem.setAttribute( "class", finalValue );
    					}
    				}
    			}
    		}

    		return this;
    	},

    	removeClass: function( value ) {
    		var classes, elem, cur, curValue, clazz, j, finalValue,
    			i = 0;

    		if ( isFunction( value ) ) {
    			return this.each( function( j ) {
    				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
    			} );
    		}

    		if ( !arguments.length ) {
    			return this.attr( "class", "" );
    		}

    		classes = classesToArray( value );

    		if ( classes.length ) {
    			while ( ( elem = this[ i++ ] ) ) {
    				curValue = getClass( elem );

    				// This expression is here for better compressibility (see addClass)
    				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

    				if ( cur ) {
    					j = 0;
    					while ( ( clazz = classes[ j++ ] ) ) {

    						// Remove *all* instances
    						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
    							cur = cur.replace( " " + clazz + " ", " " );
    						}
    					}

    					// Only assign if different to avoid unneeded rendering.
    					finalValue = stripAndCollapse( cur );
    					if ( curValue !== finalValue ) {
    						elem.setAttribute( "class", finalValue );
    					}
    				}
    			}
    		}

    		return this;
    	},

    	toggleClass: function( value, stateVal ) {
    		var type = typeof value,
    			isValidValue = type === "string" || Array.isArray( value );

    		if ( typeof stateVal === "boolean" && isValidValue ) {
    			return stateVal ? this.addClass( value ) : this.removeClass( value );
    		}

    		if ( isFunction( value ) ) {
    			return this.each( function( i ) {
    				jQuery( this ).toggleClass(
    					value.call( this, i, getClass( this ), stateVal ),
    					stateVal
    				);
    			} );
    		}

    		return this.each( function() {
    			var className, i, self, classNames;

    			if ( isValidValue ) {

    				// Toggle individual class names
    				i = 0;
    				self = jQuery( this );
    				classNames = classesToArray( value );

    				while ( ( className = classNames[ i++ ] ) ) {

    					// Check each className given, space separated list
    					if ( self.hasClass( className ) ) {
    						self.removeClass( className );
    					} else {
    						self.addClass( className );
    					}
    				}

    			// Toggle whole class name
    			} else if ( value === undefined || type === "boolean" ) {
    				className = getClass( this );
    				if ( className ) {

    					// Store className if set
    					dataPriv.set( this, "__className__", className );
    				}

    				// If the element has a class name or if we're passed `false`,
    				// then remove the whole classname (if there was one, the above saved it).
    				// Otherwise bring back whatever was previously saved (if anything),
    				// falling back to the empty string if nothing was stored.
    				if ( this.setAttribute ) {
    					this.setAttribute( "class",
    						className || value === false ?
    							"" :
    							dataPriv.get( this, "__className__" ) || ""
    					);
    				}
    			}
    		} );
    	},

    	hasClass: function( selector ) {
    		var className, elem,
    			i = 0;

    		className = " " + selector + " ";
    		while ( ( elem = this[ i++ ] ) ) {
    			if ( elem.nodeType === 1 &&
    				( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
    				return true;
    			}
    		}

    		return false;
    	}
    } );




    var rreturn = /\r/g;

    jQuery.fn.extend( {
    	val: function( value ) {
    		var hooks, ret, valueIsFunction,
    			elem = this[ 0 ];

    		if ( !arguments.length ) {
    			if ( elem ) {
    				hooks = jQuery.valHooks[ elem.type ] ||
    					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

    				if ( hooks &&
    					"get" in hooks &&
    					( ret = hooks.get( elem, "value" ) ) !== undefined
    				) {
    					return ret;
    				}

    				ret = elem.value;

    				// Handle most common string cases
    				if ( typeof ret === "string" ) {
    					return ret.replace( rreturn, "" );
    				}

    				// Handle cases where value is null/undef or number
    				return ret == null ? "" : ret;
    			}

    			return;
    		}

    		valueIsFunction = isFunction( value );

    		return this.each( function( i ) {
    			var val;

    			if ( this.nodeType !== 1 ) {
    				return;
    			}

    			if ( valueIsFunction ) {
    				val = value.call( this, i, jQuery( this ).val() );
    			} else {
    				val = value;
    			}

    			// Treat null/undefined as ""; convert numbers to string
    			if ( val == null ) {
    				val = "";

    			} else if ( typeof val === "number" ) {
    				val += "";

    			} else if ( Array.isArray( val ) ) {
    				val = jQuery.map( val, function( value ) {
    					return value == null ? "" : value + "";
    				} );
    			}

    			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

    			// If set returns undefined, fall back to normal setting
    			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
    				this.value = val;
    			}
    		} );
    	}
    } );

    jQuery.extend( {
    	valHooks: {
    		option: {
    			get: function( elem ) {

    				var val = jQuery.find.attr( elem, "value" );
    				return val != null ?
    					val :

    					// Support: IE <=10 - 11 only
    					// option.text throws exceptions (#14686, #14858)
    					// Strip and collapse whitespace
    					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
    					stripAndCollapse( jQuery.text( elem ) );
    			}
    		},
    		select: {
    			get: function( elem ) {
    				var value, option, i,
    					options = elem.options,
    					index = elem.selectedIndex,
    					one = elem.type === "select-one",
    					values = one ? null : [],
    					max = one ? index + 1 : options.length;

    				if ( index < 0 ) {
    					i = max;

    				} else {
    					i = one ? index : 0;
    				}

    				// Loop through all the selected options
    				for ( ; i < max; i++ ) {
    					option = options[ i ];

    					// Support: IE <=9 only
    					// IE8-9 doesn't update selected after form reset (#2551)
    					if ( ( option.selected || i === index ) &&

    							// Don't return options that are disabled or in a disabled optgroup
    							!option.disabled &&
    							( !option.parentNode.disabled ||
    								!nodeName( option.parentNode, "optgroup" ) ) ) {

    						// Get the specific value for the option
    						value = jQuery( option ).val();

    						// We don't need an array for one selects
    						if ( one ) {
    							return value;
    						}

    						// Multi-Selects return an array
    						values.push( value );
    					}
    				}

    				return values;
    			},

    			set: function( elem, value ) {
    				var optionSet, option,
    					options = elem.options,
    					values = jQuery.makeArray( value ),
    					i = options.length;

    				while ( i-- ) {
    					option = options[ i ];

    					/* eslint-disable no-cond-assign */

    					if ( option.selected =
    						jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
    					) {
    						optionSet = true;
    					}

    					/* eslint-enable no-cond-assign */
    				}

    				// Force browsers to behave consistently when non-matching value is set
    				if ( !optionSet ) {
    					elem.selectedIndex = -1;
    				}
    				return values;
    			}
    		}
    	}
    } );

    // Radios and checkboxes getter/setter
    jQuery.each( [ "radio", "checkbox" ], function() {
    	jQuery.valHooks[ this ] = {
    		set: function( elem, value ) {
    			if ( Array.isArray( value ) ) {
    				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
    			}
    		}
    	};
    	if ( !support.checkOn ) {
    		jQuery.valHooks[ this ].get = function( elem ) {
    			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
    		};
    	}
    } );




    // Return jQuery for attributes-only inclusion


    support.focusin = "onfocusin" in window;


    var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
    	stopPropagationCallback = function( e ) {
    		e.stopPropagation();
    	};

    jQuery.extend( jQuery.event, {

    	trigger: function( event, data, elem, onlyHandlers ) {

    		var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
    			eventPath = [ elem || document ],
    			type = hasOwn.call( event, "type" ) ? event.type : event,
    			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

    		cur = lastElement = tmp = elem = elem || document;

    		// Don't do events on text and comment nodes
    		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
    			return;
    		}

    		// focus/blur morphs to focusin/out; ensure we're not firing them right now
    		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
    			return;
    		}

    		if ( type.indexOf( "." ) > -1 ) {

    			// Namespaced trigger; create a regexp to match event type in handle()
    			namespaces = type.split( "." );
    			type = namespaces.shift();
    			namespaces.sort();
    		}
    		ontype = type.indexOf( ":" ) < 0 && "on" + type;

    		// Caller can pass in a jQuery.Event object, Object, or just an event type string
    		event = event[ jQuery.expando ] ?
    			event :
    			new jQuery.Event( type, typeof event === "object" && event );

    		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
    		event.isTrigger = onlyHandlers ? 2 : 3;
    		event.namespace = namespaces.join( "." );
    		event.rnamespace = event.namespace ?
    			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
    			null;

    		// Clean up the event in case it is being reused
    		event.result = undefined;
    		if ( !event.target ) {
    			event.target = elem;
    		}

    		// Clone any incoming data and prepend the event, creating the handler arg list
    		data = data == null ?
    			[ event ] :
    			jQuery.makeArray( data, [ event ] );

    		// Allow special events to draw outside the lines
    		special = jQuery.event.special[ type ] || {};
    		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
    			return;
    		}

    		// Determine event propagation path in advance, per W3C events spec (#9951)
    		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
    		if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {

    			bubbleType = special.delegateType || type;
    			if ( !rfocusMorph.test( bubbleType + type ) ) {
    				cur = cur.parentNode;
    			}
    			for ( ; cur; cur = cur.parentNode ) {
    				eventPath.push( cur );
    				tmp = cur;
    			}

    			// Only add window if we got to document (e.g., not plain obj or detached DOM)
    			if ( tmp === ( elem.ownerDocument || document ) ) {
    				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
    			}
    		}

    		// Fire handlers on the event path
    		i = 0;
    		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
    			lastElement = cur;
    			event.type = i > 1 ?
    				bubbleType :
    				special.bindType || type;

    			// jQuery handler
    			handle = ( dataPriv.get( cur, "events" ) || Object.create( null ) )[ event.type ] &&
    				dataPriv.get( cur, "handle" );
    			if ( handle ) {
    				handle.apply( cur, data );
    			}

    			// Native handler
    			handle = ontype && cur[ ontype ];
    			if ( handle && handle.apply && acceptData( cur ) ) {
    				event.result = handle.apply( cur, data );
    				if ( event.result === false ) {
    					event.preventDefault();
    				}
    			}
    		}
    		event.type = type;

    		// If nobody prevented the default action, do it now
    		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

    			if ( ( !special._default ||
    				special._default.apply( eventPath.pop(), data ) === false ) &&
    				acceptData( elem ) ) {

    				// Call a native DOM method on the target with the same name as the event.
    				// Don't do default actions on window, that's where global variables be (#6170)
    				if ( ontype && isFunction( elem[ type ] ) && !isWindow( elem ) ) {

    					// Don't re-trigger an onFOO event when we call its FOO() method
    					tmp = elem[ ontype ];

    					if ( tmp ) {
    						elem[ ontype ] = null;
    					}

    					// Prevent re-triggering of the same event, since we already bubbled it above
    					jQuery.event.triggered = type;

    					if ( event.isPropagationStopped() ) {
    						lastElement.addEventListener( type, stopPropagationCallback );
    					}

    					elem[ type ]();

    					if ( event.isPropagationStopped() ) {
    						lastElement.removeEventListener( type, stopPropagationCallback );
    					}

    					jQuery.event.triggered = undefined;

    					if ( tmp ) {
    						elem[ ontype ] = tmp;
    					}
    				}
    			}
    		}

    		return event.result;
    	},

    	// Piggyback on a donor event to simulate a different one
    	// Used only for `focus(in | out)` events
    	simulate: function( type, elem, event ) {
    		var e = jQuery.extend(
    			new jQuery.Event(),
    			event,
    			{
    				type: type,
    				isSimulated: true
    			}
    		);

    		jQuery.event.trigger( e, null, elem );
    	}

    } );

    jQuery.fn.extend( {

    	trigger: function( type, data ) {
    		return this.each( function() {
    			jQuery.event.trigger( type, data, this );
    		} );
    	},
    	triggerHandler: function( type, data ) {
    		var elem = this[ 0 ];
    		if ( elem ) {
    			return jQuery.event.trigger( type, data, elem, true );
    		}
    	}
    } );


    // Support: Firefox <=44
    // Firefox doesn't have focus(in | out) events
    // Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
    //
    // Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
    // focus(in | out) events fire after focus & blur events,
    // which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
    // Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
    if ( !support.focusin ) {
    	jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

    		// Attach a single capturing handler on the document while someone wants focusin/focusout
    		var handler = function( event ) {
    			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
    		};

    		jQuery.event.special[ fix ] = {
    			setup: function() {

    				// Handle: regular nodes (via `this.ownerDocument`), window
    				// (via `this.document`) & document (via `this`).
    				var doc = this.ownerDocument || this.document || this,
    					attaches = dataPriv.access( doc, fix );

    				if ( !attaches ) {
    					doc.addEventListener( orig, handler, true );
    				}
    				dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
    			},
    			teardown: function() {
    				var doc = this.ownerDocument || this.document || this,
    					attaches = dataPriv.access( doc, fix ) - 1;

    				if ( !attaches ) {
    					doc.removeEventListener( orig, handler, true );
    					dataPriv.remove( doc, fix );

    				} else {
    					dataPriv.access( doc, fix, attaches );
    				}
    			}
    		};
    	} );
    }
    var location = window.location;

    var nonce = { guid: Date.now() };

    var rquery = ( /\?/ );



    // Cross-browser xml parsing
    jQuery.parseXML = function( data ) {
    	var xml, parserErrorElem;
    	if ( !data || typeof data !== "string" ) {
    		return null;
    	}

    	// Support: IE 9 - 11 only
    	// IE throws on parseFromString with invalid input.
    	try {
    		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
    	} catch ( e ) {}

    	parserErrorElem = xml && xml.getElementsByTagName( "parsererror" )[ 0 ];
    	if ( !xml || parserErrorElem ) {
    		jQuery.error( "Invalid XML: " + (
    			parserErrorElem ?
    				jQuery.map( parserErrorElem.childNodes, function( el ) {
    					return el.textContent;
    				} ).join( "\n" ) :
    				data
    		) );
    	}
    	return xml;
    };


    var
    	rbracket = /\[\]$/,
    	rCRLF = /\r?\n/g,
    	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
    	rsubmittable = /^(?:input|select|textarea|keygen)/i;

    function buildParams( prefix, obj, traditional, add ) {
    	var name;

    	if ( Array.isArray( obj ) ) {

    		// Serialize array item.
    		jQuery.each( obj, function( i, v ) {
    			if ( traditional || rbracket.test( prefix ) ) {

    				// Treat each array item as a scalar.
    				add( prefix, v );

    			} else {

    				// Item is non-scalar (array or object), encode its numeric index.
    				buildParams(
    					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
    					v,
    					traditional,
    					add
    				);
    			}
    		} );

    	} else if ( !traditional && toType( obj ) === "object" ) {

    		// Serialize object item.
    		for ( name in obj ) {
    			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
    		}

    	} else {

    		// Serialize scalar item.
    		add( prefix, obj );
    	}
    }

    // Serialize an array of form elements or a set of
    // key/values into a query string
    jQuery.param = function( a, traditional ) {
    	var prefix,
    		s = [],
    		add = function( key, valueOrFunction ) {

    			// If value is a function, invoke it and use its return value
    			var value = isFunction( valueOrFunction ) ?
    				valueOrFunction() :
    				valueOrFunction;

    			s[ s.length ] = encodeURIComponent( key ) + "=" +
    				encodeURIComponent( value == null ? "" : value );
    		};

    	if ( a == null ) {
    		return "";
    	}

    	// If an array was passed in, assume that it is an array of form elements.
    	if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

    		// Serialize the form elements
    		jQuery.each( a, function() {
    			add( this.name, this.value );
    		} );

    	} else {

    		// If traditional, encode the "old" way (the way 1.3.2 or older
    		// did it), otherwise encode params recursively.
    		for ( prefix in a ) {
    			buildParams( prefix, a[ prefix ], traditional, add );
    		}
    	}

    	// Return the resulting serialization
    	return s.join( "&" );
    };

    jQuery.fn.extend( {
    	serialize: function() {
    		return jQuery.param( this.serializeArray() );
    	},
    	serializeArray: function() {
    		return this.map( function() {

    			// Can add propHook for "elements" to filter or add form elements
    			var elements = jQuery.prop( this, "elements" );
    			return elements ? jQuery.makeArray( elements ) : this;
    		} ).filter( function() {
    			var type = this.type;

    			// Use .is( ":disabled" ) so that fieldset[disabled] works
    			return this.name && !jQuery( this ).is( ":disabled" ) &&
    				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
    				( this.checked || !rcheckableType.test( type ) );
    		} ).map( function( _i, elem ) {
    			var val = jQuery( this ).val();

    			if ( val == null ) {
    				return null;
    			}

    			if ( Array.isArray( val ) ) {
    				return jQuery.map( val, function( val ) {
    					return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
    				} );
    			}

    			return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
    		} ).get();
    	}
    } );


    var
    	r20 = /%20/g,
    	rhash = /#.*$/,
    	rantiCache = /([?&])_=[^&]*/,
    	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

    	// #7653, #8125, #8152: local protocol detection
    	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
    	rnoContent = /^(?:GET|HEAD)$/,
    	rprotocol = /^\/\//,

    	/* Prefilters
    	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
    	 * 2) These are called:
    	 *    - BEFORE asking for a transport
    	 *    - AFTER param serialization (s.data is a string if s.processData is true)
    	 * 3) key is the dataType
    	 * 4) the catchall symbol "*" can be used
    	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
    	 */
    	prefilters = {},

    	/* Transports bindings
    	 * 1) key is the dataType
    	 * 2) the catchall symbol "*" can be used
    	 * 3) selection will start with transport dataType and THEN go to "*" if needed
    	 */
    	transports = {},

    	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
    	allTypes = "*/".concat( "*" ),

    	// Anchor tag for parsing the document origin
    	originAnchor = document.createElement( "a" );

    originAnchor.href = location.href;

    // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
    function addToPrefiltersOrTransports( structure ) {

    	// dataTypeExpression is optional and defaults to "*"
    	return function( dataTypeExpression, func ) {

    		if ( typeof dataTypeExpression !== "string" ) {
    			func = dataTypeExpression;
    			dataTypeExpression = "*";
    		}

    		var dataType,
    			i = 0,
    			dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

    		if ( isFunction( func ) ) {

    			// For each dataType in the dataTypeExpression
    			while ( ( dataType = dataTypes[ i++ ] ) ) {

    				// Prepend if requested
    				if ( dataType[ 0 ] === "+" ) {
    					dataType = dataType.slice( 1 ) || "*";
    					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

    				// Otherwise append
    				} else {
    					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
    				}
    			}
    		}
    	};
    }

    // Base inspection function for prefilters and transports
    function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

    	var inspected = {},
    		seekingTransport = ( structure === transports );

    	function inspect( dataType ) {
    		var selected;
    		inspected[ dataType ] = true;
    		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
    			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
    			if ( typeof dataTypeOrTransport === "string" &&
    				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

    				options.dataTypes.unshift( dataTypeOrTransport );
    				inspect( dataTypeOrTransport );
    				return false;
    			} else if ( seekingTransport ) {
    				return !( selected = dataTypeOrTransport );
    			}
    		} );
    		return selected;
    	}

    	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
    }

    // A special extend for ajax options
    // that takes "flat" options (not to be deep extended)
    // Fixes #9887
    function ajaxExtend( target, src ) {
    	var key, deep,
    		flatOptions = jQuery.ajaxSettings.flatOptions || {};

    	for ( key in src ) {
    		if ( src[ key ] !== undefined ) {
    			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
    		}
    	}
    	if ( deep ) {
    		jQuery.extend( true, target, deep );
    	}

    	return target;
    }

    /* Handles responses to an ajax request:
     * - finds the right dataType (mediates between content-type and expected dataType)
     * - returns the corresponding response
     */
    function ajaxHandleResponses( s, jqXHR, responses ) {

    	var ct, type, finalDataType, firstDataType,
    		contents = s.contents,
    		dataTypes = s.dataTypes;

    	// Remove auto dataType and get content-type in the process
    	while ( dataTypes[ 0 ] === "*" ) {
    		dataTypes.shift();
    		if ( ct === undefined ) {
    			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
    		}
    	}

    	// Check if we're dealing with a known content-type
    	if ( ct ) {
    		for ( type in contents ) {
    			if ( contents[ type ] && contents[ type ].test( ct ) ) {
    				dataTypes.unshift( type );
    				break;
    			}
    		}
    	}

    	// Check to see if we have a response for the expected dataType
    	if ( dataTypes[ 0 ] in responses ) {
    		finalDataType = dataTypes[ 0 ];
    	} else {

    		// Try convertible dataTypes
    		for ( type in responses ) {
    			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
    				finalDataType = type;
    				break;
    			}
    			if ( !firstDataType ) {
    				firstDataType = type;
    			}
    		}

    		// Or just use first one
    		finalDataType = finalDataType || firstDataType;
    	}

    	// If we found a dataType
    	// We add the dataType to the list if needed
    	// and return the corresponding response
    	if ( finalDataType ) {
    		if ( finalDataType !== dataTypes[ 0 ] ) {
    			dataTypes.unshift( finalDataType );
    		}
    		return responses[ finalDataType ];
    	}
    }

    /* Chain conversions given the request and the original response
     * Also sets the responseXXX fields on the jqXHR instance
     */
    function ajaxConvert( s, response, jqXHR, isSuccess ) {
    	var conv2, current, conv, tmp, prev,
    		converters = {},

    		// Work with a copy of dataTypes in case we need to modify it for conversion
    		dataTypes = s.dataTypes.slice();

    	// Create converters map with lowercased keys
    	if ( dataTypes[ 1 ] ) {
    		for ( conv in s.converters ) {
    			converters[ conv.toLowerCase() ] = s.converters[ conv ];
    		}
    	}

    	current = dataTypes.shift();

    	// Convert to each sequential dataType
    	while ( current ) {

    		if ( s.responseFields[ current ] ) {
    			jqXHR[ s.responseFields[ current ] ] = response;
    		}

    		// Apply the dataFilter if provided
    		if ( !prev && isSuccess && s.dataFilter ) {
    			response = s.dataFilter( response, s.dataType );
    		}

    		prev = current;
    		current = dataTypes.shift();

    		if ( current ) {

    			// There's only work to do if current dataType is non-auto
    			if ( current === "*" ) {

    				current = prev;

    			// Convert response if prev dataType is non-auto and differs from current
    			} else if ( prev !== "*" && prev !== current ) {

    				// Seek a direct converter
    				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

    				// If none found, seek a pair
    				if ( !conv ) {
    					for ( conv2 in converters ) {

    						// If conv2 outputs current
    						tmp = conv2.split( " " );
    						if ( tmp[ 1 ] === current ) {

    							// If prev can be converted to accepted input
    							conv = converters[ prev + " " + tmp[ 0 ] ] ||
    								converters[ "* " + tmp[ 0 ] ];
    							if ( conv ) {

    								// Condense equivalence converters
    								if ( conv === true ) {
    									conv = converters[ conv2 ];

    								// Otherwise, insert the intermediate dataType
    								} else if ( converters[ conv2 ] !== true ) {
    									current = tmp[ 0 ];
    									dataTypes.unshift( tmp[ 1 ] );
    								}
    								break;
    							}
    						}
    					}
    				}

    				// Apply converter (if not an equivalence)
    				if ( conv !== true ) {

    					// Unless errors are allowed to bubble, catch and return them
    					if ( conv && s.throws ) {
    						response = conv( response );
    					} else {
    						try {
    							response = conv( response );
    						} catch ( e ) {
    							return {
    								state: "parsererror",
    								error: conv ? e : "No conversion from " + prev + " to " + current
    							};
    						}
    					}
    				}
    			}
    		}
    	}

    	return { state: "success", data: response };
    }

    jQuery.extend( {

    	// Counter for holding the number of active queries
    	active: 0,

    	// Last-Modified header cache for next request
    	lastModified: {},
    	etag: {},

    	ajaxSettings: {
    		url: location.href,
    		type: "GET",
    		isLocal: rlocalProtocol.test( location.protocol ),
    		global: true,
    		processData: true,
    		async: true,
    		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

    		/*
    		timeout: 0,
    		data: null,
    		dataType: null,
    		username: null,
    		password: null,
    		cache: null,
    		throws: false,
    		traditional: false,
    		headers: {},
    		*/

    		accepts: {
    			"*": allTypes,
    			text: "text/plain",
    			html: "text/html",
    			xml: "application/xml, text/xml",
    			json: "application/json, text/javascript"
    		},

    		contents: {
    			xml: /\bxml\b/,
    			html: /\bhtml/,
    			json: /\bjson\b/
    		},

    		responseFields: {
    			xml: "responseXML",
    			text: "responseText",
    			json: "responseJSON"
    		},

    		// Data converters
    		// Keys separate source (or catchall "*") and destination types with a single space
    		converters: {

    			// Convert anything to text
    			"* text": String,

    			// Text to html (true = no transformation)
    			"text html": true,

    			// Evaluate text as a json expression
    			"text json": JSON.parse,

    			// Parse text as xml
    			"text xml": jQuery.parseXML
    		},

    		// For options that shouldn't be deep extended:
    		// you can add your own custom options here if
    		// and when you create one that shouldn't be
    		// deep extended (see ajaxExtend)
    		flatOptions: {
    			url: true,
    			context: true
    		}
    	},

    	// Creates a full fledged settings object into target
    	// with both ajaxSettings and settings fields.
    	// If target is omitted, writes into ajaxSettings.
    	ajaxSetup: function( target, settings ) {
    		return settings ?

    			// Building a settings object
    			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

    			// Extending ajaxSettings
    			ajaxExtend( jQuery.ajaxSettings, target );
    	},

    	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
    	ajaxTransport: addToPrefiltersOrTransports( transports ),

    	// Main method
    	ajax: function( url, options ) {

    		// If url is an object, simulate pre-1.5 signature
    		if ( typeof url === "object" ) {
    			options = url;
    			url = undefined;
    		}

    		// Force options to be an object
    		options = options || {};

    		var transport,

    			// URL without anti-cache param
    			cacheURL,

    			// Response headers
    			responseHeadersString,
    			responseHeaders,

    			// timeout handle
    			timeoutTimer,

    			// Url cleanup var
    			urlAnchor,

    			// Request state (becomes false upon send and true upon completion)
    			completed,

    			// To know if global events are to be dispatched
    			fireGlobals,

    			// Loop variable
    			i,

    			// uncached part of the url
    			uncached,

    			// Create the final options object
    			s = jQuery.ajaxSetup( {}, options ),

    			// Callbacks context
    			callbackContext = s.context || s,

    			// Context for global events is callbackContext if it is a DOM node or jQuery collection
    			globalEventContext = s.context &&
    				( callbackContext.nodeType || callbackContext.jquery ) ?
    				jQuery( callbackContext ) :
    				jQuery.event,

    			// Deferreds
    			deferred = jQuery.Deferred(),
    			completeDeferred = jQuery.Callbacks( "once memory" ),

    			// Status-dependent callbacks
    			statusCode = s.statusCode || {},

    			// Headers (they are sent all at once)
    			requestHeaders = {},
    			requestHeadersNames = {},

    			// Default abort message
    			strAbort = "canceled",

    			// Fake xhr
    			jqXHR = {
    				readyState: 0,

    				// Builds headers hashtable if needed
    				getResponseHeader: function( key ) {
    					var match;
    					if ( completed ) {
    						if ( !responseHeaders ) {
    							responseHeaders = {};
    							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
    								responseHeaders[ match[ 1 ].toLowerCase() + " " ] =
    									( responseHeaders[ match[ 1 ].toLowerCase() + " " ] || [] )
    										.concat( match[ 2 ] );
    							}
    						}
    						match = responseHeaders[ key.toLowerCase() + " " ];
    					}
    					return match == null ? null : match.join( ", " );
    				},

    				// Raw string
    				getAllResponseHeaders: function() {
    					return completed ? responseHeadersString : null;
    				},

    				// Caches the header
    				setRequestHeader: function( name, value ) {
    					if ( completed == null ) {
    						name = requestHeadersNames[ name.toLowerCase() ] =
    							requestHeadersNames[ name.toLowerCase() ] || name;
    						requestHeaders[ name ] = value;
    					}
    					return this;
    				},

    				// Overrides response content-type header
    				overrideMimeType: function( type ) {
    					if ( completed == null ) {
    						s.mimeType = type;
    					}
    					return this;
    				},

    				// Status-dependent callbacks
    				statusCode: function( map ) {
    					var code;
    					if ( map ) {
    						if ( completed ) {

    							// Execute the appropriate callbacks
    							jqXHR.always( map[ jqXHR.status ] );
    						} else {

    							// Lazy-add the new callbacks in a way that preserves old ones
    							for ( code in map ) {
    								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
    							}
    						}
    					}
    					return this;
    				},

    				// Cancel the request
    				abort: function( statusText ) {
    					var finalText = statusText || strAbort;
    					if ( transport ) {
    						transport.abort( finalText );
    					}
    					done( 0, finalText );
    					return this;
    				}
    			};

    		// Attach deferreds
    		deferred.promise( jqXHR );

    		// Add protocol if not provided (prefilters might expect it)
    		// Handle falsy url in the settings object (#10093: consistency with old signature)
    		// We also use the url parameter if available
    		s.url = ( ( url || s.url || location.href ) + "" )
    			.replace( rprotocol, location.protocol + "//" );

    		// Alias method option to type as per ticket #12004
    		s.type = options.method || options.type || s.method || s.type;

    		// Extract dataTypes list
    		s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

    		// A cross-domain request is in order when the origin doesn't match the current origin.
    		if ( s.crossDomain == null ) {
    			urlAnchor = document.createElement( "a" );

    			// Support: IE <=8 - 11, Edge 12 - 15
    			// IE throws exception on accessing the href property if url is malformed,
    			// e.g. http://example.com:80x/
    			try {
    				urlAnchor.href = s.url;

    				// Support: IE <=8 - 11 only
    				// Anchor's host property isn't correctly set when s.url is relative
    				urlAnchor.href = urlAnchor.href;
    				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
    					urlAnchor.protocol + "//" + urlAnchor.host;
    			} catch ( e ) {

    				// If there is an error parsing the URL, assume it is crossDomain,
    				// it can be rejected by the transport if it is invalid
    				s.crossDomain = true;
    			}
    		}

    		// Convert data if not already a string
    		if ( s.data && s.processData && typeof s.data !== "string" ) {
    			s.data = jQuery.param( s.data, s.traditional );
    		}

    		// Apply prefilters
    		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

    		// If request was aborted inside a prefilter, stop there
    		if ( completed ) {
    			return jqXHR;
    		}

    		// We can fire global events as of now if asked to
    		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
    		fireGlobals = jQuery.event && s.global;

    		// Watch for a new set of requests
    		if ( fireGlobals && jQuery.active++ === 0 ) {
    			jQuery.event.trigger( "ajaxStart" );
    		}

    		// Uppercase the type
    		s.type = s.type.toUpperCase();

    		// Determine if request has content
    		s.hasContent = !rnoContent.test( s.type );

    		// Save the URL in case we're toying with the If-Modified-Since
    		// and/or If-None-Match header later on
    		// Remove hash to simplify url manipulation
    		cacheURL = s.url.replace( rhash, "" );

    		// More options handling for requests with no content
    		if ( !s.hasContent ) {

    			// Remember the hash so we can put it back
    			uncached = s.url.slice( cacheURL.length );

    			// If data is available and should be processed, append data to url
    			if ( s.data && ( s.processData || typeof s.data === "string" ) ) {
    				cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

    				// #9682: remove data so that it's not used in an eventual retry
    				delete s.data;
    			}

    			// Add or update anti-cache param if needed
    			if ( s.cache === false ) {
    				cacheURL = cacheURL.replace( rantiCache, "$1" );
    				uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce.guid++ ) +
    					uncached;
    			}

    			// Put hash and anti-cache on the URL that will be requested (gh-1732)
    			s.url = cacheURL + uncached;

    		// Change '%20' to '+' if this is encoded form body content (gh-2658)
    		} else if ( s.data && s.processData &&
    			( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
    			s.data = s.data.replace( r20, "+" );
    		}

    		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
    		if ( s.ifModified ) {
    			if ( jQuery.lastModified[ cacheURL ] ) {
    				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
    			}
    			if ( jQuery.etag[ cacheURL ] ) {
    				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
    			}
    		}

    		// Set the correct header, if data is being sent
    		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
    			jqXHR.setRequestHeader( "Content-Type", s.contentType );
    		}

    		// Set the Accepts header for the server, depending on the dataType
    		jqXHR.setRequestHeader(
    			"Accept",
    			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
    				s.accepts[ s.dataTypes[ 0 ] ] +
    					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
    				s.accepts[ "*" ]
    		);

    		// Check for headers option
    		for ( i in s.headers ) {
    			jqXHR.setRequestHeader( i, s.headers[ i ] );
    		}

    		// Allow custom headers/mimetypes and early abort
    		if ( s.beforeSend &&
    			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

    			// Abort if not done already and return
    			return jqXHR.abort();
    		}

    		// Aborting is no longer a cancellation
    		strAbort = "abort";

    		// Install callbacks on deferreds
    		completeDeferred.add( s.complete );
    		jqXHR.done( s.success );
    		jqXHR.fail( s.error );

    		// Get transport
    		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

    		// If no transport, we auto-abort
    		if ( !transport ) {
    			done( -1, "No Transport" );
    		} else {
    			jqXHR.readyState = 1;

    			// Send global event
    			if ( fireGlobals ) {
    				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
    			}

    			// If request was aborted inside ajaxSend, stop there
    			if ( completed ) {
    				return jqXHR;
    			}

    			// Timeout
    			if ( s.async && s.timeout > 0 ) {
    				timeoutTimer = window.setTimeout( function() {
    					jqXHR.abort( "timeout" );
    				}, s.timeout );
    			}

    			try {
    				completed = false;
    				transport.send( requestHeaders, done );
    			} catch ( e ) {

    				// Rethrow post-completion exceptions
    				if ( completed ) {
    					throw e;
    				}

    				// Propagate others as results
    				done( -1, e );
    			}
    		}

    		// Callback for when everything is done
    		function done( status, nativeStatusText, responses, headers ) {
    			var isSuccess, success, error, response, modified,
    				statusText = nativeStatusText;

    			// Ignore repeat invocations
    			if ( completed ) {
    				return;
    			}

    			completed = true;

    			// Clear timeout if it exists
    			if ( timeoutTimer ) {
    				window.clearTimeout( timeoutTimer );
    			}

    			// Dereference transport for early garbage collection
    			// (no matter how long the jqXHR object will be used)
    			transport = undefined;

    			// Cache response headers
    			responseHeadersString = headers || "";

    			// Set readyState
    			jqXHR.readyState = status > 0 ? 4 : 0;

    			// Determine if successful
    			isSuccess = status >= 200 && status < 300 || status === 304;

    			// Get response data
    			if ( responses ) {
    				response = ajaxHandleResponses( s, jqXHR, responses );
    			}

    			// Use a noop converter for missing script but not if jsonp
    			if ( !isSuccess &&
    				jQuery.inArray( "script", s.dataTypes ) > -1 &&
    				jQuery.inArray( "json", s.dataTypes ) < 0 ) {
    				s.converters[ "text script" ] = function() {};
    			}

    			// Convert no matter what (that way responseXXX fields are always set)
    			response = ajaxConvert( s, response, jqXHR, isSuccess );

    			// If successful, handle type chaining
    			if ( isSuccess ) {

    				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
    				if ( s.ifModified ) {
    					modified = jqXHR.getResponseHeader( "Last-Modified" );
    					if ( modified ) {
    						jQuery.lastModified[ cacheURL ] = modified;
    					}
    					modified = jqXHR.getResponseHeader( "etag" );
    					if ( modified ) {
    						jQuery.etag[ cacheURL ] = modified;
    					}
    				}

    				// if no content
    				if ( status === 204 || s.type === "HEAD" ) {
    					statusText = "nocontent";

    				// if not modified
    				} else if ( status === 304 ) {
    					statusText = "notmodified";

    				// If we have data, let's convert it
    				} else {
    					statusText = response.state;
    					success = response.data;
    					error = response.error;
    					isSuccess = !error;
    				}
    			} else {

    				// Extract error from statusText and normalize for non-aborts
    				error = statusText;
    				if ( status || !statusText ) {
    					statusText = "error";
    					if ( status < 0 ) {
    						status = 0;
    					}
    				}
    			}

    			// Set data for the fake xhr object
    			jqXHR.status = status;
    			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

    			// Success/Error
    			if ( isSuccess ) {
    				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
    			} else {
    				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
    			}

    			// Status-dependent callbacks
    			jqXHR.statusCode( statusCode );
    			statusCode = undefined;

    			if ( fireGlobals ) {
    				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
    					[ jqXHR, s, isSuccess ? success : error ] );
    			}

    			// Complete
    			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

    			if ( fireGlobals ) {
    				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

    				// Handle the global AJAX counter
    				if ( !( --jQuery.active ) ) {
    					jQuery.event.trigger( "ajaxStop" );
    				}
    			}
    		}

    		return jqXHR;
    	},

    	getJSON: function( url, data, callback ) {
    		return jQuery.get( url, data, callback, "json" );
    	},

    	getScript: function( url, callback ) {
    		return jQuery.get( url, undefined, callback, "script" );
    	}
    } );

    jQuery.each( [ "get", "post" ], function( _i, method ) {
    	jQuery[ method ] = function( url, data, callback, type ) {

    		// Shift arguments if data argument was omitted
    		if ( isFunction( data ) ) {
    			type = type || callback;
    			callback = data;
    			data = undefined;
    		}

    		// The url can be an options object (which then must have .url)
    		return jQuery.ajax( jQuery.extend( {
    			url: url,
    			type: method,
    			dataType: type,
    			data: data,
    			success: callback
    		}, jQuery.isPlainObject( url ) && url ) );
    	};
    } );

    jQuery.ajaxPrefilter( function( s ) {
    	var i;
    	for ( i in s.headers ) {
    		if ( i.toLowerCase() === "content-type" ) {
    			s.contentType = s.headers[ i ] || "";
    		}
    	}
    } );


    jQuery._evalUrl = function( url, options, doc ) {
    	return jQuery.ajax( {
    		url: url,

    		// Make this explicit, since user can override this through ajaxSetup (#11264)
    		type: "GET",
    		dataType: "script",
    		cache: true,
    		async: false,
    		global: false,

    		// Only evaluate the response if it is successful (gh-4126)
    		// dataFilter is not invoked for failure responses, so using it instead
    		// of the default converter is kludgy but it works.
    		converters: {
    			"text script": function() {}
    		},
    		dataFilter: function( response ) {
    			jQuery.globalEval( response, options, doc );
    		}
    	} );
    };


    jQuery.fn.extend( {
    	wrapAll: function( html ) {
    		var wrap;

    		if ( this[ 0 ] ) {
    			if ( isFunction( html ) ) {
    				html = html.call( this[ 0 ] );
    			}

    			// The elements to wrap the target around
    			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

    			if ( this[ 0 ].parentNode ) {
    				wrap.insertBefore( this[ 0 ] );
    			}

    			wrap.map( function() {
    				var elem = this;

    				while ( elem.firstElementChild ) {
    					elem = elem.firstElementChild;
    				}

    				return elem;
    			} ).append( this );
    		}

    		return this;
    	},

    	wrapInner: function( html ) {
    		if ( isFunction( html ) ) {
    			return this.each( function( i ) {
    				jQuery( this ).wrapInner( html.call( this, i ) );
    			} );
    		}

    		return this.each( function() {
    			var self = jQuery( this ),
    				contents = self.contents();

    			if ( contents.length ) {
    				contents.wrapAll( html );

    			} else {
    				self.append( html );
    			}
    		} );
    	},

    	wrap: function( html ) {
    		var htmlIsFunction = isFunction( html );

    		return this.each( function( i ) {
    			jQuery( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
    		} );
    	},

    	unwrap: function( selector ) {
    		this.parent( selector ).not( "body" ).each( function() {
    			jQuery( this ).replaceWith( this.childNodes );
    		} );
    		return this;
    	}
    } );


    jQuery.expr.pseudos.hidden = function( elem ) {
    	return !jQuery.expr.pseudos.visible( elem );
    };
    jQuery.expr.pseudos.visible = function( elem ) {
    	return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
    };




    jQuery.ajaxSettings.xhr = function() {
    	try {
    		return new window.XMLHttpRequest();
    	} catch ( e ) {}
    };

    var xhrSuccessStatus = {

    		// File protocol always yields status code 0, assume 200
    		0: 200,

    		// Support: IE <=9 only
    		// #1450: sometimes IE returns 1223 when it should be 204
    		1223: 204
    	},
    	xhrSupported = jQuery.ajaxSettings.xhr();

    support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
    support.ajax = xhrSupported = !!xhrSupported;

    jQuery.ajaxTransport( function( options ) {
    	var callback, errorCallback;

    	// Cross domain only allowed if supported through XMLHttpRequest
    	if ( support.cors || xhrSupported && !options.crossDomain ) {
    		return {
    			send: function( headers, complete ) {
    				var i,
    					xhr = options.xhr();

    				xhr.open(
    					options.type,
    					options.url,
    					options.async,
    					options.username,
    					options.password
    				);

    				// Apply custom fields if provided
    				if ( options.xhrFields ) {
    					for ( i in options.xhrFields ) {
    						xhr[ i ] = options.xhrFields[ i ];
    					}
    				}

    				// Override mime type if needed
    				if ( options.mimeType && xhr.overrideMimeType ) {
    					xhr.overrideMimeType( options.mimeType );
    				}

    				// X-Requested-With header
    				// For cross-domain requests, seeing as conditions for a preflight are
    				// akin to a jigsaw puzzle, we simply never set it to be sure.
    				// (it can always be set on a per-request basis or even using ajaxSetup)
    				// For same-domain requests, won't change header if already provided.
    				if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
    					headers[ "X-Requested-With" ] = "XMLHttpRequest";
    				}

    				// Set headers
    				for ( i in headers ) {
    					xhr.setRequestHeader( i, headers[ i ] );
    				}

    				// Callback
    				callback = function( type ) {
    					return function() {
    						if ( callback ) {
    							callback = errorCallback = xhr.onload =
    								xhr.onerror = xhr.onabort = xhr.ontimeout =
    									xhr.onreadystatechange = null;

    							if ( type === "abort" ) {
    								xhr.abort();
    							} else if ( type === "error" ) {

    								// Support: IE <=9 only
    								// On a manual native abort, IE9 throws
    								// errors on any property access that is not readyState
    								if ( typeof xhr.status !== "number" ) {
    									complete( 0, "error" );
    								} else {
    									complete(

    										// File: protocol always yields status 0; see #8605, #14207
    										xhr.status,
    										xhr.statusText
    									);
    								}
    							} else {
    								complete(
    									xhrSuccessStatus[ xhr.status ] || xhr.status,
    									xhr.statusText,

    									// Support: IE <=9 only
    									// IE9 has no XHR2 but throws on binary (trac-11426)
    									// For XHR2 non-text, let the caller handle it (gh-2498)
    									( xhr.responseType || "text" ) !== "text"  ||
    									typeof xhr.responseText !== "string" ?
    										{ binary: xhr.response } :
    										{ text: xhr.responseText },
    									xhr.getAllResponseHeaders()
    								);
    							}
    						}
    					};
    				};

    				// Listen to events
    				xhr.onload = callback();
    				errorCallback = xhr.onerror = xhr.ontimeout = callback( "error" );

    				// Support: IE 9 only
    				// Use onreadystatechange to replace onabort
    				// to handle uncaught aborts
    				if ( xhr.onabort !== undefined ) {
    					xhr.onabort = errorCallback;
    				} else {
    					xhr.onreadystatechange = function() {

    						// Check readyState before timeout as it changes
    						if ( xhr.readyState === 4 ) {

    							// Allow onerror to be called first,
    							// but that will not handle a native abort
    							// Also, save errorCallback to a variable
    							// as xhr.onerror cannot be accessed
    							window.setTimeout( function() {
    								if ( callback ) {
    									errorCallback();
    								}
    							} );
    						}
    					};
    				}

    				// Create the abort callback
    				callback = callback( "abort" );

    				try {

    					// Do send the request (this may raise an exception)
    					xhr.send( options.hasContent && options.data || null );
    				} catch ( e ) {

    					// #14683: Only rethrow if this hasn't been notified as an error yet
    					if ( callback ) {
    						throw e;
    					}
    				}
    			},

    			abort: function() {
    				if ( callback ) {
    					callback();
    				}
    			}
    		};
    	}
    } );




    // Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
    jQuery.ajaxPrefilter( function( s ) {
    	if ( s.crossDomain ) {
    		s.contents.script = false;
    	}
    } );

    // Install script dataType
    jQuery.ajaxSetup( {
    	accepts: {
    		script: "text/javascript, application/javascript, " +
    			"application/ecmascript, application/x-ecmascript"
    	},
    	contents: {
    		script: /\b(?:java|ecma)script\b/
    	},
    	converters: {
    		"text script": function( text ) {
    			jQuery.globalEval( text );
    			return text;
    		}
    	}
    } );

    // Handle cache's special case and crossDomain
    jQuery.ajaxPrefilter( "script", function( s ) {
    	if ( s.cache === undefined ) {
    		s.cache = false;
    	}
    	if ( s.crossDomain ) {
    		s.type = "GET";
    	}
    } );

    // Bind script tag hack transport
    jQuery.ajaxTransport( "script", function( s ) {

    	// This transport only deals with cross domain or forced-by-attrs requests
    	if ( s.crossDomain || s.scriptAttrs ) {
    		var script, callback;
    		return {
    			send: function( _, complete ) {
    				script = jQuery( "<script>" )
    					.attr( s.scriptAttrs || {} )
    					.prop( { charset: s.scriptCharset, src: s.url } )
    					.on( "load error", callback = function( evt ) {
    						script.remove();
    						callback = null;
    						if ( evt ) {
    							complete( evt.type === "error" ? 404 : 200, evt.type );
    						}
    					} );

    				// Use native DOM manipulation to avoid our domManip AJAX trickery
    				document.head.appendChild( script[ 0 ] );
    			},
    			abort: function() {
    				if ( callback ) {
    					callback();
    				}
    			}
    		};
    	}
    } );




    var oldCallbacks = [],
    	rjsonp = /(=)\?(?=&|$)|\?\?/;

    // Default jsonp settings
    jQuery.ajaxSetup( {
    	jsonp: "callback",
    	jsonpCallback: function() {
    		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce.guid++ ) );
    		this[ callback ] = true;
    		return callback;
    	}
    } );

    // Detect, normalize options and install callbacks for jsonp requests
    jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

    	var callbackName, overwritten, responseContainer,
    		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
    			"url" :
    			typeof s.data === "string" &&
    				( s.contentType || "" )
    					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
    				rjsonp.test( s.data ) && "data"
    		);

    	// Handle iff the expected data type is "jsonp" or we have a parameter to set
    	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

    		// Get callback name, remembering preexisting value associated with it
    		callbackName = s.jsonpCallback = isFunction( s.jsonpCallback ) ?
    			s.jsonpCallback() :
    			s.jsonpCallback;

    		// Insert callback into url or form data
    		if ( jsonProp ) {
    			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
    		} else if ( s.jsonp !== false ) {
    			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
    		}

    		// Use data converter to retrieve json after script execution
    		s.converters[ "script json" ] = function() {
    			if ( !responseContainer ) {
    				jQuery.error( callbackName + " was not called" );
    			}
    			return responseContainer[ 0 ];
    		};

    		// Force json dataType
    		s.dataTypes[ 0 ] = "json";

    		// Install callback
    		overwritten = window[ callbackName ];
    		window[ callbackName ] = function() {
    			responseContainer = arguments;
    		};

    		// Clean-up function (fires after converters)
    		jqXHR.always( function() {

    			// If previous value didn't exist - remove it
    			if ( overwritten === undefined ) {
    				jQuery( window ).removeProp( callbackName );

    			// Otherwise restore preexisting value
    			} else {
    				window[ callbackName ] = overwritten;
    			}

    			// Save back as free
    			if ( s[ callbackName ] ) {

    				// Make sure that re-using the options doesn't screw things around
    				s.jsonpCallback = originalSettings.jsonpCallback;

    				// Save the callback name for future use
    				oldCallbacks.push( callbackName );
    			}

    			// Call if it was a function and we have a response
    			if ( responseContainer && isFunction( overwritten ) ) {
    				overwritten( responseContainer[ 0 ] );
    			}

    			responseContainer = overwritten = undefined;
    		} );

    		// Delegate to script
    		return "script";
    	}
    } );




    // Support: Safari 8 only
    // In Safari 8 documents created via document.implementation.createHTMLDocument
    // collapse sibling forms: the second one becomes a child of the first one.
    // Because of that, this security measure has to be disabled in Safari 8.
    // https://bugs.webkit.org/show_bug.cgi?id=137337
    support.createHTMLDocument = ( function() {
    	var body = document.implementation.createHTMLDocument( "" ).body;
    	body.innerHTML = "<form></form><form></form>";
    	return body.childNodes.length === 2;
    } )();


    // Argument "data" should be string of html
    // context (optional): If specified, the fragment will be created in this context,
    // defaults to document
    // keepScripts (optional): If true, will include scripts passed in the html string
    jQuery.parseHTML = function( data, context, keepScripts ) {
    	if ( typeof data !== "string" ) {
    		return [];
    	}
    	if ( typeof context === "boolean" ) {
    		keepScripts = context;
    		context = false;
    	}

    	var base, parsed, scripts;

    	if ( !context ) {

    		// Stop scripts or inline event handlers from being executed immediately
    		// by using document.implementation
    		if ( support.createHTMLDocument ) {
    			context = document.implementation.createHTMLDocument( "" );

    			// Set the base href for the created document
    			// so any parsed elements with URLs
    			// are based on the document's URL (gh-2965)
    			base = context.createElement( "base" );
    			base.href = document.location.href;
    			context.head.appendChild( base );
    		} else {
    			context = document;
    		}
    	}

    	parsed = rsingleTag.exec( data );
    	scripts = !keepScripts && [];

    	// Single tag
    	if ( parsed ) {
    		return [ context.createElement( parsed[ 1 ] ) ];
    	}

    	parsed = buildFragment( [ data ], context, scripts );

    	if ( scripts && scripts.length ) {
    		jQuery( scripts ).remove();
    	}

    	return jQuery.merge( [], parsed.childNodes );
    };


    /**
     * Load a url into a page
     */
    jQuery.fn.load = function( url, params, callback ) {
    	var selector, type, response,
    		self = this,
    		off = url.indexOf( " " );

    	if ( off > -1 ) {
    		selector = stripAndCollapse( url.slice( off ) );
    		url = url.slice( 0, off );
    	}

    	// If it's a function
    	if ( isFunction( params ) ) {

    		// We assume that it's the callback
    		callback = params;
    		params = undefined;

    	// Otherwise, build a param string
    	} else if ( params && typeof params === "object" ) {
    		type = "POST";
    	}

    	// If we have elements to modify, make the request
    	if ( self.length > 0 ) {
    		jQuery.ajax( {
    			url: url,

    			// If "type" variable is undefined, then "GET" method will be used.
    			// Make value of this field explicit since
    			// user can override it through ajaxSetup method
    			type: type || "GET",
    			dataType: "html",
    			data: params
    		} ).done( function( responseText ) {

    			// Save response for use in complete callback
    			response = arguments;

    			self.html( selector ?

    				// If a selector was specified, locate the right elements in a dummy div
    				// Exclude scripts to avoid IE 'Permission Denied' errors
    				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

    				// Otherwise use the full result
    				responseText );

    		// If the request succeeds, this function gets "data", "status", "jqXHR"
    		// but they are ignored because response was set above.
    		// If it fails, this function gets "jqXHR", "status", "error"
    		} ).always( callback && function( jqXHR, status ) {
    			self.each( function() {
    				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
    			} );
    		} );
    	}

    	return this;
    };




    jQuery.expr.pseudos.animated = function( elem ) {
    	return jQuery.grep( jQuery.timers, function( fn ) {
    		return elem === fn.elem;
    	} ).length;
    };




    jQuery.offset = {
    	setOffset: function( elem, options, i ) {
    		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
    			position = jQuery.css( elem, "position" ),
    			curElem = jQuery( elem ),
    			props = {};

    		// Set position first, in-case top/left are set even on static elem
    		if ( position === "static" ) {
    			elem.style.position = "relative";
    		}

    		curOffset = curElem.offset();
    		curCSSTop = jQuery.css( elem, "top" );
    		curCSSLeft = jQuery.css( elem, "left" );
    		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
    			( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

    		// Need to be able to calculate position if either
    		// top or left is auto and position is either absolute or fixed
    		if ( calculatePosition ) {
    			curPosition = curElem.position();
    			curTop = curPosition.top;
    			curLeft = curPosition.left;

    		} else {
    			curTop = parseFloat( curCSSTop ) || 0;
    			curLeft = parseFloat( curCSSLeft ) || 0;
    		}

    		if ( isFunction( options ) ) {

    			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
    			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
    		}

    		if ( options.top != null ) {
    			props.top = ( options.top - curOffset.top ) + curTop;
    		}
    		if ( options.left != null ) {
    			props.left = ( options.left - curOffset.left ) + curLeft;
    		}

    		if ( "using" in options ) {
    			options.using.call( elem, props );

    		} else {
    			curElem.css( props );
    		}
    	}
    };

    jQuery.fn.extend( {

    	// offset() relates an element's border box to the document origin
    	offset: function( options ) {

    		// Preserve chaining for setter
    		if ( arguments.length ) {
    			return options === undefined ?
    				this :
    				this.each( function( i ) {
    					jQuery.offset.setOffset( this, options, i );
    				} );
    		}

    		var rect, win,
    			elem = this[ 0 ];

    		if ( !elem ) {
    			return;
    		}

    		// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
    		// Support: IE <=11 only
    		// Running getBoundingClientRect on a
    		// disconnected node in IE throws an error
    		if ( !elem.getClientRects().length ) {
    			return { top: 0, left: 0 };
    		}

    		// Get document-relative position by adding viewport scroll to viewport-relative gBCR
    		rect = elem.getBoundingClientRect();
    		win = elem.ownerDocument.defaultView;
    		return {
    			top: rect.top + win.pageYOffset,
    			left: rect.left + win.pageXOffset
    		};
    	},

    	// position() relates an element's margin box to its offset parent's padding box
    	// This corresponds to the behavior of CSS absolute positioning
    	position: function() {
    		if ( !this[ 0 ] ) {
    			return;
    		}

    		var offsetParent, offset, doc,
    			elem = this[ 0 ],
    			parentOffset = { top: 0, left: 0 };

    		// position:fixed elements are offset from the viewport, which itself always has zero offset
    		if ( jQuery.css( elem, "position" ) === "fixed" ) {

    			// Assume position:fixed implies availability of getBoundingClientRect
    			offset = elem.getBoundingClientRect();

    		} else {
    			offset = this.offset();

    			// Account for the *real* offset parent, which can be the document or its root element
    			// when a statically positioned element is identified
    			doc = elem.ownerDocument;
    			offsetParent = elem.offsetParent || doc.documentElement;
    			while ( offsetParent &&
    				( offsetParent === doc.body || offsetParent === doc.documentElement ) &&
    				jQuery.css( offsetParent, "position" ) === "static" ) {

    				offsetParent = offsetParent.parentNode;
    			}
    			if ( offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 ) {

    				// Incorporate borders into its offset, since they are outside its content origin
    				parentOffset = jQuery( offsetParent ).offset();
    				parentOffset.top += jQuery.css( offsetParent, "borderTopWidth", true );
    				parentOffset.left += jQuery.css( offsetParent, "borderLeftWidth", true );
    			}
    		}

    		// Subtract parent offsets and element margins
    		return {
    			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
    			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
    		};
    	},

    	// This method will return documentElement in the following cases:
    	// 1) For the element inside the iframe without offsetParent, this method will return
    	//    documentElement of the parent window
    	// 2) For the hidden or detached element
    	// 3) For body or html element, i.e. in case of the html node - it will return itself
    	//
    	// but those exceptions were never presented as a real life use-cases
    	// and might be considered as more preferable results.
    	//
    	// This logic, however, is not guaranteed and can change at any point in the future
    	offsetParent: function() {
    		return this.map( function() {
    			var offsetParent = this.offsetParent;

    			while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
    				offsetParent = offsetParent.offsetParent;
    			}

    			return offsetParent || documentElement;
    		} );
    	}
    } );

    // Create scrollLeft and scrollTop methods
    jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
    	var top = "pageYOffset" === prop;

    	jQuery.fn[ method ] = function( val ) {
    		return access( this, function( elem, method, val ) {

    			// Coalesce documents and windows
    			var win;
    			if ( isWindow( elem ) ) {
    				win = elem;
    			} else if ( elem.nodeType === 9 ) {
    				win = elem.defaultView;
    			}

    			if ( val === undefined ) {
    				return win ? win[ prop ] : elem[ method ];
    			}

    			if ( win ) {
    				win.scrollTo(
    					!top ? val : win.pageXOffset,
    					top ? val : win.pageYOffset
    				);

    			} else {
    				elem[ method ] = val;
    			}
    		}, method, val, arguments.length );
    	};
    } );

    // Support: Safari <=7 - 9.1, Chrome <=37 - 49
    // Add the top/left cssHooks using jQuery.fn.position
    // Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
    // Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
    // getComputedStyle returns percent when specified for top/left/bottom/right;
    // rather than make the css module depend on the offset module, just check for it here
    jQuery.each( [ "top", "left" ], function( _i, prop ) {
    	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
    		function( elem, computed ) {
    			if ( computed ) {
    				computed = curCSS( elem, prop );

    				// If curCSS returns percentage, fallback to offset
    				return rnumnonpx.test( computed ) ?
    					jQuery( elem ).position()[ prop ] + "px" :
    					computed;
    			}
    		}
    	);
    } );


    // Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
    jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
    	jQuery.each( {
    		padding: "inner" + name,
    		content: type,
    		"": "outer" + name
    	}, function( defaultExtra, funcName ) {

    		// Margin is only for outerHeight, outerWidth
    		jQuery.fn[ funcName ] = function( margin, value ) {
    			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
    				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

    			return access( this, function( elem, type, value ) {
    				var doc;

    				if ( isWindow( elem ) ) {

    					// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
    					return funcName.indexOf( "outer" ) === 0 ?
    						elem[ "inner" + name ] :
    						elem.document.documentElement[ "client" + name ];
    				}

    				// Get document width or height
    				if ( elem.nodeType === 9 ) {
    					doc = elem.documentElement;

    					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
    					// whichever is greatest
    					return Math.max(
    						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
    						elem.body[ "offset" + name ], doc[ "offset" + name ],
    						doc[ "client" + name ]
    					);
    				}

    				return value === undefined ?

    					// Get width or height on the element, requesting but not forcing parseFloat
    					jQuery.css( elem, type, extra ) :

    					// Set width or height on the element
    					jQuery.style( elem, type, value, extra );
    			}, type, chainable ? margin : undefined, chainable );
    		};
    	} );
    } );


    jQuery.each( [
    	"ajaxStart",
    	"ajaxStop",
    	"ajaxComplete",
    	"ajaxError",
    	"ajaxSuccess",
    	"ajaxSend"
    ], function( _i, type ) {
    	jQuery.fn[ type ] = function( fn ) {
    		return this.on( type, fn );
    	};
    } );




    jQuery.fn.extend( {

    	bind: function( types, data, fn ) {
    		return this.on( types, null, data, fn );
    	},
    	unbind: function( types, fn ) {
    		return this.off( types, null, fn );
    	},

    	delegate: function( selector, types, data, fn ) {
    		return this.on( types, selector, data, fn );
    	},
    	undelegate: function( selector, types, fn ) {

    		// ( namespace ) or ( selector, types [, fn] )
    		return arguments.length === 1 ?
    			this.off( selector, "**" ) :
    			this.off( types, selector || "**", fn );
    	},

    	hover: function( fnOver, fnOut ) {
    		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
    	}
    } );

    jQuery.each(
    	( "blur focus focusin focusout resize scroll click dblclick " +
    	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
    	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
    	function( _i, name ) {

    		// Handle event binding
    		jQuery.fn[ name ] = function( data, fn ) {
    			return arguments.length > 0 ?
    				this.on( name, null, data, fn ) :
    				this.trigger( name );
    		};
    	}
    );




    // Support: Android <=4.0 only
    // Make sure we trim BOM and NBSP
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

    // Bind a function to a context, optionally partially applying any
    // arguments.
    // jQuery.proxy is deprecated to promote standards (specifically Function#bind)
    // However, it is not slated for removal any time soon
    jQuery.proxy = function( fn, context ) {
    	var tmp, args, proxy;

    	if ( typeof context === "string" ) {
    		tmp = fn[ context ];
    		context = fn;
    		fn = tmp;
    	}

    	// Quick check to determine if target is callable, in the spec
    	// this throws a TypeError, but we will just return undefined.
    	if ( !isFunction( fn ) ) {
    		return undefined;
    	}

    	// Simulated bind
    	args = slice.call( arguments, 2 );
    	proxy = function() {
    		return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
    	};

    	// Set the guid of unique handler to the same of original handler, so it can be removed
    	proxy.guid = fn.guid = fn.guid || jQuery.guid++;

    	return proxy;
    };

    jQuery.holdReady = function( hold ) {
    	if ( hold ) {
    		jQuery.readyWait++;
    	} else {
    		jQuery.ready( true );
    	}
    };
    jQuery.isArray = Array.isArray;
    jQuery.parseJSON = JSON.parse;
    jQuery.nodeName = nodeName;
    jQuery.isFunction = isFunction;
    jQuery.isWindow = isWindow;
    jQuery.camelCase = camelCase;
    jQuery.type = toType;

    jQuery.now = Date.now;

    jQuery.isNumeric = function( obj ) {

    	// As of jQuery 3.0, isNumeric is limited to
    	// strings and numbers (primitives or objects)
    	// that can be coerced to finite numbers (gh-2662)
    	var type = jQuery.type( obj );
    	return ( type === "number" || type === "string" ) &&

    		// parseFloat NaNs numeric-cast false positives ("")
    		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
    		// subtraction forces infinities to NaN
    		!isNaN( obj - parseFloat( obj ) );
    };

    jQuery.trim = function( text ) {
    	return text == null ?
    		"" :
    		( text + "" ).replace( rtrim, "" );
    };




    var

    	// Map over jQuery in case of overwrite
    	_jQuery = window.jQuery,

    	// Map over the $ in case of overwrite
    	_$ = window.$;

    jQuery.noConflict = function( deep ) {
    	if ( window.$ === jQuery ) {
    		window.$ = _$;
    	}

    	if ( deep && window.jQuery === jQuery ) {
    		window.jQuery = _jQuery;
    	}

    	return jQuery;
    };

    // Expose jQuery and $ identifiers, even in AMD
    // (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
    // and CommonJS for browser emulators (#13566)
    if ( typeof noGlobal === "undefined" ) {
    	window.jQuery = window.$ = jQuery;
    }




    return jQuery;
    } );
    });

    jquery('document').ajaxError((event, jqXHR, ajaxSettings, thrownError) => {
        console.error('error happened during execution');
    });
    jquery('document').ajaxSuccess((event, jqXHR, ajaxSettings, thrownError) => {
        console.log('successfully executed request');
    });
    class HttpClient {
        constructor() { }
        getJSON(url, accessToken) {
            return jquery.ajax({
                accepts: {
                    json: 'application/json'
                },
                url: url,
                headers: {
                    Authorization: 'Bearer ' + accessToken
                },
                method: 'GET',
                statusCode: {
                    404: () => { console.error('resource not found'); },
                    401: () => { console.error('not authorized to access resource'); },
                    500: () => { console.error('error occured serverside'); }
                },
                timeout: 5000
            });
        }
        putJSON() {
            return jquery.ajax();
        }
        deleteJSON() {
            return jquery.ajax();
        }
        postJSON() {
            return jquery.ajax();
        }
    }

    /*! @azure/msal-browser v2.15.0 2021-06-29 */
    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics$1 = function(d, b) {
        extendStatics$1 = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics$1(d, b);
    };

    function __extends$1(d, b) {
        extendStatics$1(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign$1 = function() {
        __assign$1 = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign$1.apply(this, arguments);
    };

    function __awaiter$1(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator$1(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var Constants = {
        LIBRARY_NAME: "MSAL.JS",
        SKU: "msal.js.common",
        // Prefix for all library cache entries
        CACHE_PREFIX: "msal",
        // default authority
        DEFAULT_AUTHORITY: "https://login.microsoftonline.com/common/",
        DEFAULT_AUTHORITY_HOST: "login.microsoftonline.com",
        // ADFS String
        ADFS: "adfs",
        // Default AAD Instance Discovery Endpoint
        AAD_INSTANCE_DISCOVERY_ENDPT: "https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=",
        // Resource delimiter - used for certain cache entries
        RESOURCE_DELIM: "|",
        // Placeholder for non-existent account ids/objects
        NO_ACCOUNT: "NO_ACCOUNT",
        // Claims
        CLAIMS: "claims",
        // Consumer UTID
        CONSUMER_UTID: "9188040d-6c67-4c5b-b112-36a304b66dad",
        // Default scopes
        OPENID_SCOPE: "openid",
        PROFILE_SCOPE: "profile",
        OFFLINE_ACCESS_SCOPE: "offline_access",
        EMAIL_SCOPE: "email",
        // Default response type for authorization code flow
        CODE_RESPONSE_TYPE: "code",
        CODE_GRANT_TYPE: "authorization_code",
        RT_GRANT_TYPE: "refresh_token",
        FRAGMENT_RESPONSE_MODE: "fragment",
        S256_CODE_CHALLENGE_METHOD: "S256",
        URL_FORM_CONTENT_TYPE: "application/x-www-form-urlencoded;charset=utf-8",
        AUTHORIZATION_PENDING: "authorization_pending",
        NOT_DEFINED: "not_defined",
        EMPTY_STRING: "",
        FORWARD_SLASH: "/",
        IMDS_ENDPOINT: "http://169.254.169.254/metadata/instance/compute/location",
        IMDS_VERSION: "2020-06-01",
        IMDS_TIMEOUT: 2000,
        AZURE_REGION_AUTO_DISCOVER_FLAG: "AUTO_DISCOVER",
        REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX: "login.microsoft.com",
        KNOWN_PUBLIC_CLOUDS: ["login.microsoftonline.com", "login.windows.net", "login.microsoft.com", "sts.windows.net"]
    };
    var OIDC_DEFAULT_SCOPES = [
        Constants.OPENID_SCOPE,
        Constants.PROFILE_SCOPE,
        Constants.OFFLINE_ACCESS_SCOPE
    ];
    var OIDC_SCOPES = __spreadArrays(OIDC_DEFAULT_SCOPES, [
        Constants.EMAIL_SCOPE
    ]);
    /**
     * Request header names
     */
    var HeaderNames;
    (function (HeaderNames) {
        HeaderNames["CONTENT_TYPE"] = "Content-Type";
        HeaderNames["RETRY_AFTER"] = "Retry-After";
        HeaderNames["CCS_HEADER"] = "X-AnchorMailbox";
    })(HeaderNames || (HeaderNames = {}));
    /**
     * Persistent cache keys MSAL which stay while user is logged in.
     */
    var PersistentCacheKeys;
    (function (PersistentCacheKeys) {
        PersistentCacheKeys["ID_TOKEN"] = "idtoken";
        PersistentCacheKeys["CLIENT_INFO"] = "client.info";
        PersistentCacheKeys["ADAL_ID_TOKEN"] = "adal.idtoken";
        PersistentCacheKeys["ERROR"] = "error";
        PersistentCacheKeys["ERROR_DESC"] = "error.description";
    })(PersistentCacheKeys || (PersistentCacheKeys = {}));
    /**
     * String constants related to AAD Authority
     */
    var AADAuthorityConstants;
    (function (AADAuthorityConstants) {
        AADAuthorityConstants["COMMON"] = "common";
        AADAuthorityConstants["ORGANIZATIONS"] = "organizations";
        AADAuthorityConstants["CONSUMERS"] = "consumers";
    })(AADAuthorityConstants || (AADAuthorityConstants = {}));
    /**
     * Keys in the hashParams sent by AAD Server
     */
    var AADServerParamKeys;
    (function (AADServerParamKeys) {
        AADServerParamKeys["CLIENT_ID"] = "client_id";
        AADServerParamKeys["REDIRECT_URI"] = "redirect_uri";
        AADServerParamKeys["RESPONSE_TYPE"] = "response_type";
        AADServerParamKeys["RESPONSE_MODE"] = "response_mode";
        AADServerParamKeys["GRANT_TYPE"] = "grant_type";
        AADServerParamKeys["CLAIMS"] = "claims";
        AADServerParamKeys["SCOPE"] = "scope";
        AADServerParamKeys["ERROR"] = "error";
        AADServerParamKeys["ERROR_DESCRIPTION"] = "error_description";
        AADServerParamKeys["ACCESS_TOKEN"] = "access_token";
        AADServerParamKeys["ID_TOKEN"] = "id_token";
        AADServerParamKeys["REFRESH_TOKEN"] = "refresh_token";
        AADServerParamKeys["EXPIRES_IN"] = "expires_in";
        AADServerParamKeys["STATE"] = "state";
        AADServerParamKeys["NONCE"] = "nonce";
        AADServerParamKeys["PROMPT"] = "prompt";
        AADServerParamKeys["SESSION_STATE"] = "session_state";
        AADServerParamKeys["CLIENT_INFO"] = "client_info";
        AADServerParamKeys["CODE"] = "code";
        AADServerParamKeys["CODE_CHALLENGE"] = "code_challenge";
        AADServerParamKeys["CODE_CHALLENGE_METHOD"] = "code_challenge_method";
        AADServerParamKeys["CODE_VERIFIER"] = "code_verifier";
        AADServerParamKeys["CLIENT_REQUEST_ID"] = "client-request-id";
        AADServerParamKeys["X_CLIENT_SKU"] = "x-client-SKU";
        AADServerParamKeys["X_CLIENT_VER"] = "x-client-VER";
        AADServerParamKeys["X_CLIENT_OS"] = "x-client-OS";
        AADServerParamKeys["X_CLIENT_CPU"] = "x-client-CPU";
        AADServerParamKeys["X_CLIENT_CURR_TELEM"] = "x-client-current-telemetry";
        AADServerParamKeys["X_CLIENT_LAST_TELEM"] = "x-client-last-telemetry";
        AADServerParamKeys["X_MS_LIB_CAPABILITY"] = "x-ms-lib-capability";
        AADServerParamKeys["POST_LOGOUT_URI"] = "post_logout_redirect_uri";
        AADServerParamKeys["ID_TOKEN_HINT"] = "id_token_hint";
        AADServerParamKeys["DEVICE_CODE"] = "device_code";
        AADServerParamKeys["CLIENT_SECRET"] = "client_secret";
        AADServerParamKeys["CLIENT_ASSERTION"] = "client_assertion";
        AADServerParamKeys["CLIENT_ASSERTION_TYPE"] = "client_assertion_type";
        AADServerParamKeys["TOKEN_TYPE"] = "token_type";
        AADServerParamKeys["REQ_CNF"] = "req_cnf";
        AADServerParamKeys["OBO_ASSERTION"] = "assertion";
        AADServerParamKeys["REQUESTED_TOKEN_USE"] = "requested_token_use";
        AADServerParamKeys["ON_BEHALF_OF"] = "on_behalf_of";
        AADServerParamKeys["FOCI"] = "foci";
        AADServerParamKeys["CCS_HEADER"] = "X-AnchorMailbox";
    })(AADServerParamKeys || (AADServerParamKeys = {}));
    /**
     * Claims request keys
     */
    var ClaimsRequestKeys;
    (function (ClaimsRequestKeys) {
        ClaimsRequestKeys["ACCESS_TOKEN"] = "access_token";
        ClaimsRequestKeys["XMS_CC"] = "xms_cc";
    })(ClaimsRequestKeys || (ClaimsRequestKeys = {}));
    /**
     * we considered making this "enum" in the request instead of string, however it looks like the allowed list of
     * prompt values kept changing over past couple of years. There are some undocumented prompt values for some
     * internal partners too, hence the choice of generic "string" type instead of the "enum"
     */
    var PromptValue = {
        LOGIN: "login",
        SELECT_ACCOUNT: "select_account",
        CONSENT: "consent",
        NONE: "none",
    };
    /**
     * SSO Types - generated to populate hints
     */
    var SSOTypes;
    (function (SSOTypes) {
        SSOTypes["ACCOUNT"] = "account";
        SSOTypes["SID"] = "sid";
        SSOTypes["LOGIN_HINT"] = "login_hint";
        SSOTypes["ID_TOKEN"] = "id_token";
        SSOTypes["DOMAIN_HINT"] = "domain_hint";
        SSOTypes["ORGANIZATIONS"] = "organizations";
        SSOTypes["CONSUMERS"] = "consumers";
        SSOTypes["ACCOUNT_ID"] = "accountIdentifier";
        SSOTypes["HOMEACCOUNT_ID"] = "homeAccountIdentifier";
    })(SSOTypes || (SSOTypes = {}));
    /**
     * allowed values for codeVerifier
     */
    var CodeChallengeMethodValues = {
        PLAIN: "plain",
        S256: "S256"
    };
    /**
     * allowed values for response_mode
     */
    var ResponseMode;
    (function (ResponseMode) {
        ResponseMode["QUERY"] = "query";
        ResponseMode["FRAGMENT"] = "fragment";
        ResponseMode["FORM_POST"] = "form_post";
    })(ResponseMode || (ResponseMode = {}));
    /**
     * allowed grant_type
     */
    var GrantType;
    (function (GrantType) {
        GrantType["IMPLICIT_GRANT"] = "implicit";
        GrantType["AUTHORIZATION_CODE_GRANT"] = "authorization_code";
        GrantType["CLIENT_CREDENTIALS_GRANT"] = "client_credentials";
        GrantType["RESOURCE_OWNER_PASSWORD_GRANT"] = "password";
        GrantType["REFRESH_TOKEN_GRANT"] = "refresh_token";
        GrantType["DEVICE_CODE_GRANT"] = "device_code";
        GrantType["JWT_BEARER"] = "urn:ietf:params:oauth:grant-type:jwt-bearer";
    })(GrantType || (GrantType = {}));
    /**
     * Account types in Cache
     */
    var CacheAccountType;
    (function (CacheAccountType) {
        CacheAccountType["MSSTS_ACCOUNT_TYPE"] = "MSSTS";
        CacheAccountType["ADFS_ACCOUNT_TYPE"] = "ADFS";
        CacheAccountType["MSAV1_ACCOUNT_TYPE"] = "MSA";
        CacheAccountType["GENERIC_ACCOUNT_TYPE"] = "Generic"; // NTLM, Kerberos, FBA, Basic etc
    })(CacheAccountType || (CacheAccountType = {}));
    /**
     * Separators used in cache
     */
    var Separators;
    (function (Separators) {
        Separators["CACHE_KEY_SEPARATOR"] = "-";
        Separators["CLIENT_INFO_SEPARATOR"] = ".";
    })(Separators || (Separators = {}));
    /**
     * Credential Type stored in the cache
     */
    var CredentialType;
    (function (CredentialType) {
        CredentialType["ID_TOKEN"] = "IdToken";
        CredentialType["ACCESS_TOKEN"] = "AccessToken";
        CredentialType["ACCESS_TOKEN_WITH_AUTH_SCHEME"] = "AccessToken_With_AuthScheme";
        CredentialType["REFRESH_TOKEN"] = "RefreshToken";
    })(CredentialType || (CredentialType = {}));
    /**
     * Credential Type stored in the cache
     */
    var CacheSchemaType;
    (function (CacheSchemaType) {
        CacheSchemaType["ACCOUNT"] = "Account";
        CacheSchemaType["CREDENTIAL"] = "Credential";
        CacheSchemaType["ID_TOKEN"] = "IdToken";
        CacheSchemaType["ACCESS_TOKEN"] = "AccessToken";
        CacheSchemaType["REFRESH_TOKEN"] = "RefreshToken";
        CacheSchemaType["APP_METADATA"] = "AppMetadata";
        CacheSchemaType["TEMPORARY"] = "TempCache";
        CacheSchemaType["TELEMETRY"] = "Telemetry";
        CacheSchemaType["UNDEFINED"] = "Undefined";
        CacheSchemaType["THROTTLING"] = "Throttling";
    })(CacheSchemaType || (CacheSchemaType = {}));
    /**
     * Combine all cache types
     */
    var CacheType;
    (function (CacheType) {
        CacheType[CacheType["ADFS"] = 1001] = "ADFS";
        CacheType[CacheType["MSA"] = 1002] = "MSA";
        CacheType[CacheType["MSSTS"] = 1003] = "MSSTS";
        CacheType[CacheType["GENERIC"] = 1004] = "GENERIC";
        CacheType[CacheType["ACCESS_TOKEN"] = 2001] = "ACCESS_TOKEN";
        CacheType[CacheType["REFRESH_TOKEN"] = 2002] = "REFRESH_TOKEN";
        CacheType[CacheType["ID_TOKEN"] = 2003] = "ID_TOKEN";
        CacheType[CacheType["APP_METADATA"] = 3001] = "APP_METADATA";
        CacheType[CacheType["UNDEFINED"] = 9999] = "UNDEFINED";
    })(CacheType || (CacheType = {}));
    /**
     * More Cache related constants
     */
    var APP_METADATA = "appmetadata";
    var CLIENT_INFO = "client_info";
    var THE_FAMILY_ID = "1";
    var AUTHORITY_METADATA_CONSTANTS = {
        CACHE_KEY: "authority-metadata",
        REFRESH_TIME_SECONDS: 3600 * 24 // 24 Hours
    };
    var AuthorityMetadataSource;
    (function (AuthorityMetadataSource) {
        AuthorityMetadataSource["CONFIG"] = "config";
        AuthorityMetadataSource["CACHE"] = "cache";
        AuthorityMetadataSource["NETWORK"] = "network";
    })(AuthorityMetadataSource || (AuthorityMetadataSource = {}));
    var SERVER_TELEM_CONSTANTS = {
        SCHEMA_VERSION: 2,
        MAX_CUR_HEADER_BYTES: 80,
        MAX_LAST_HEADER_BYTES: 330,
        MAX_CACHED_ERRORS: 50,
        CACHE_KEY: "server-telemetry",
        CATEGORY_SEPARATOR: "|",
        VALUE_SEPARATOR: ",",
        OVERFLOW_TRUE: "1",
        OVERFLOW_FALSE: "0",
        UNKNOWN_ERROR: "unknown_error"
    };
    /**
     * Type of the authentication request
     */
    var AuthenticationScheme;
    (function (AuthenticationScheme) {
        AuthenticationScheme["POP"] = "pop";
        AuthenticationScheme["BEARER"] = "Bearer";
    })(AuthenticationScheme || (AuthenticationScheme = {}));
    /**
     * Constants related to throttling
     */
    var ThrottlingConstants = {
        // Default time to throttle RequestThumbprint in seconds
        DEFAULT_THROTTLE_TIME_SECONDS: 60,
        // Default maximum time to throttle in seconds, overrides what the server sends back
        DEFAULT_MAX_THROTTLE_TIME_SECONDS: 3600,
        // Prefix for storing throttling entries
        THROTTLING_PREFIX: "throttling",
        // Value assigned to the x-ms-lib-capability header to indicate to the server the library supports throttling
        X_MS_LIB_CAPABILITY_VALUE: "retry-after, h429"
    };
    var Errors = {
        INVALID_GRANT_ERROR: "invalid_grant",
        CLIENT_MISMATCH_ERROR: "client_mismatch",
    };
    /**
     * Password grant parameters
     */
    var PasswordGrantConstants;
    (function (PasswordGrantConstants) {
        PasswordGrantConstants["username"] = "username";
        PasswordGrantConstants["password"] = "password";
    })(PasswordGrantConstants || (PasswordGrantConstants = {}));
    /**
     * Response codes
     */
    var ResponseCodes;
    (function (ResponseCodes) {
        ResponseCodes[ResponseCodes["httpSuccess"] = 200] = "httpSuccess";
        ResponseCodes[ResponseCodes["httpBadRequest"] = 400] = "httpBadRequest";
    })(ResponseCodes || (ResponseCodes = {}));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * AuthErrorMessage class containing string constants used by error codes and messages.
     */
    var AuthErrorMessage = {
        unexpectedError: {
            code: "unexpected_error",
            desc: "Unexpected error in authentication."
        }
    };
    /**
     * General error class thrown by the MSAL.js library.
     */
    var AuthError = /** @class */ (function (_super) {
        __extends(AuthError, _super);
        function AuthError(errorCode, errorMessage, suberror) {
            var _this = this;
            var errorString = errorMessage ? errorCode + ": " + errorMessage : errorCode;
            _this = _super.call(this, errorString) || this;
            Object.setPrototypeOf(_this, AuthError.prototype);
            _this.errorCode = errorCode || Constants.EMPTY_STRING;
            _this.errorMessage = errorMessage || "";
            _this.subError = suberror || "";
            _this.name = "AuthError";
            return _this;
        }
        /**
         * Creates an error that is thrown when something unexpected happens in the library.
         * @param errDesc
         */
        AuthError.createUnexpectedError = function (errDesc) {
            return new AuthError(AuthErrorMessage.unexpectedError.code, AuthErrorMessage.unexpectedError.desc + ": " + errDesc);
        };
        return AuthError;
    }(Error));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var DEFAULT_CRYPTO_IMPLEMENTATION = {
        createNewGuid: function () {
            var notImplErr = "Crypto interface - createNewGuid() has not been implemented";
            throw AuthError.createUnexpectedError(notImplErr);
        },
        base64Decode: function () {
            var notImplErr = "Crypto interface - base64Decode() has not been implemented";
            throw AuthError.createUnexpectedError(notImplErr);
        },
        base64Encode: function () {
            var notImplErr = "Crypto interface - base64Encode() has not been implemented";
            throw AuthError.createUnexpectedError(notImplErr);
        },
        generatePkceCodes: function () {
            return __awaiter(this, void 0, void 0, function () {
                var notImplErr;
                return __generator(this, function (_a) {
                    notImplErr = "Crypto interface - generatePkceCodes() has not been implemented";
                    throw AuthError.createUnexpectedError(notImplErr);
                });
            });
        },
        getPublicKeyThumbprint: function () {
            return __awaiter(this, void 0, void 0, function () {
                var notImplErr;
                return __generator(this, function (_a) {
                    notImplErr = "Crypto interface - getPublicKeyThumbprint() has not been implemented";
                    throw AuthError.createUnexpectedError(notImplErr);
                });
            });
        },
        signJwt: function () {
            return __awaiter(this, void 0, void 0, function () {
                var notImplErr;
                return __generator(this, function (_a) {
                    notImplErr = "Crypto interface - signJwt() has not been implemented";
                    throw AuthError.createUnexpectedError(notImplErr);
                });
            });
        }
    };

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * ClientAuthErrorMessage class containing string constants used by error codes and messages.
     */
    var ClientAuthErrorMessage = {
        clientInfoDecodingError: {
            code: "client_info_decoding_error",
            desc: "The client info could not be parsed/decoded correctly. Please review the trace to determine the root cause."
        },
        clientInfoEmptyError: {
            code: "client_info_empty_error",
            desc: "The client info was empty. Please review the trace to determine the root cause."
        },
        tokenParsingError: {
            code: "token_parsing_error",
            desc: "Token cannot be parsed. Please review stack trace to determine root cause."
        },
        nullOrEmptyToken: {
            code: "null_or_empty_token",
            desc: "The token is null or empty. Please review the trace to determine the root cause."
        },
        endpointResolutionError: {
            code: "endpoints_resolution_error",
            desc: "Error: could not resolve endpoints. Please check network and try again."
        },
        networkError: {
            code: "network_error",
            desc: "Network request failed. Please check network trace to determine root cause."
        },
        unableToGetOpenidConfigError: {
            code: "openid_config_error",
            desc: "Could not retrieve endpoints. Check your authority and verify the .well-known/openid-configuration endpoint returns the required endpoints."
        },
        hashNotDeserialized: {
            code: "hash_not_deserialized",
            desc: "The hash parameters could not be deserialized. Please review the trace to determine the root cause."
        },
        blankGuidGenerated: {
            code: "blank_guid_generated",
            desc: "The guid generated was blank. Please review the trace to determine the root cause."
        },
        invalidStateError: {
            code: "invalid_state",
            desc: "State was not the expected format. Please check the logs to determine whether the request was sent using ProtocolUtils.setRequestState()."
        },
        stateMismatchError: {
            code: "state_mismatch",
            desc: "State mismatch error. Please check your network. Continued requests may cause cache overflow."
        },
        stateNotFoundError: {
            code: "state_not_found",
            desc: "State not found"
        },
        nonceMismatchError: {
            code: "nonce_mismatch",
            desc: "Nonce mismatch error. This may be caused by a race condition in concurrent requests."
        },
        nonceNotFoundError: {
            code: "nonce_not_found",
            desc: "nonce not found"
        },
        noTokensFoundError: {
            code: "no_tokens_found",
            desc: "No tokens were found for the given scopes, and no authorization code was passed to acquireToken. You must retrieve an authorization code before making a call to acquireToken()."
        },
        multipleMatchingTokens: {
            code: "multiple_matching_tokens",
            desc: "The cache contains multiple tokens satisfying the requirements. " +
                "Call AcquireToken again providing more requirements such as authority or account."
        },
        multipleMatchingAccounts: {
            code: "multiple_matching_accounts",
            desc: "The cache contains multiple accounts satisfying the given parameters. Please pass more info to obtain the correct account"
        },
        multipleMatchingAppMetadata: {
            code: "multiple_matching_appMetadata",
            desc: "The cache contains multiple appMetadata satisfying the given parameters. Please pass more info to obtain the correct appMetadata"
        },
        tokenRequestCannotBeMade: {
            code: "request_cannot_be_made",
            desc: "Token request cannot be made without authorization code or refresh token."
        },
        appendEmptyScopeError: {
            code: "cannot_append_empty_scope",
            desc: "Cannot append null or empty scope to ScopeSet. Please check the stack trace for more info."
        },
        removeEmptyScopeError: {
            code: "cannot_remove_empty_scope",
            desc: "Cannot remove null or empty scope from ScopeSet. Please check the stack trace for more info."
        },
        appendScopeSetError: {
            code: "cannot_append_scopeset",
            desc: "Cannot append ScopeSet due to error."
        },
        emptyInputScopeSetError: {
            code: "empty_input_scopeset",
            desc: "Empty input ScopeSet cannot be processed."
        },
        DeviceCodePollingCancelled: {
            code: "device_code_polling_cancelled",
            desc: "Caller has cancelled token endpoint polling during device code flow by setting DeviceCodeRequest.cancel = true."
        },
        DeviceCodeExpired: {
            code: "device_code_expired",
            desc: "Device code is expired."
        },
        DeviceCodeUnknownError: {
            code: "device_code_unknown_error",
            desc: "Device code stopped polling for unknown reasons."
        },
        NoAccountInSilentRequest: {
            code: "no_account_in_silent_request",
            desc: "Please pass an account object, silent flow is not supported without account information"
        },
        invalidCacheRecord: {
            code: "invalid_cache_record",
            desc: "Cache record object was null or undefined."
        },
        invalidCacheEnvironment: {
            code: "invalid_cache_environment",
            desc: "Invalid environment when attempting to create cache entry"
        },
        noAccountFound: {
            code: "no_account_found",
            desc: "No account found in cache for given key."
        },
        CachePluginError: {
            code: "no cache plugin set on CacheManager",
            desc: "ICachePlugin needs to be set before using readFromStorage or writeFromStorage"
        },
        noCryptoObj: {
            code: "no_crypto_object",
            desc: "No crypto object detected. This is required for the following operation: "
        },
        invalidCacheType: {
            code: "invalid_cache_type",
            desc: "Invalid cache type"
        },
        unexpectedAccountType: {
            code: "unexpected_account_type",
            desc: "Unexpected account type."
        },
        unexpectedCredentialType: {
            code: "unexpected_credential_type",
            desc: "Unexpected credential type."
        },
        invalidAssertion: {
            code: "invalid_assertion",
            desc: "Client assertion must meet requirements described in https://tools.ietf.org/html/rfc7515"
        },
        invalidClientCredential: {
            code: "invalid_client_credential",
            desc: "Client credential (secret, certificate, or assertion) must not be empty when creating a confidential client. An application should at most have one credential"
        },
        tokenRefreshRequired: {
            code: "token_refresh_required",
            desc: "Cannot return token from cache because it must be refreshed. This may be due to one of the following reasons: forceRefresh parameter is set to true, claims have been requested, there is no cached access token or it is expired."
        },
        userTimeoutReached: {
            code: "user_timeout_reached",
            desc: "User defined timeout for device code polling reached",
        },
        tokenClaimsRequired: {
            code: "token_claims_cnf_required_for_signedjwt",
            desc: "Cannot generate a POP jwt if the token_claims are not populated"
        },
        noAuthorizationCodeFromServer: {
            code: "authorization_code_missing_from_server_response",
            desc: "Server response does not contain an authorization code to proceed"
        },
        noAzureRegionDetected: {
            code: "no_azure_region_detected",
            desc: "No azure region was detected and no fallback was made available"
        },
        accessTokenEntityNullError: {
            code: "access_token_entity_null",
            desc: "Access token entity is null, please check logs and cache to ensure a valid access token is present."
        }
    };
    /**
     * Error thrown when there is an error in the client code running on the browser.
     */
    var ClientAuthError = /** @class */ (function (_super) {
        __extends(ClientAuthError, _super);
        function ClientAuthError(errorCode, errorMessage) {
            var _this = _super.call(this, errorCode, errorMessage) || this;
            _this.name = "ClientAuthError";
            Object.setPrototypeOf(_this, ClientAuthError.prototype);
            return _this;
        }
        /**
         * Creates an error thrown when client info object doesn't decode correctly.
         * @param caughtError
         */
        ClientAuthError.createClientInfoDecodingError = function (caughtError) {
            return new ClientAuthError(ClientAuthErrorMessage.clientInfoDecodingError.code, ClientAuthErrorMessage.clientInfoDecodingError.desc + " Failed with error: " + caughtError);
        };
        /**
         * Creates an error thrown if the client info is empty.
         * @param rawClientInfo
         */
        ClientAuthError.createClientInfoEmptyError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.clientInfoEmptyError.code, "" + ClientAuthErrorMessage.clientInfoEmptyError.desc);
        };
        /**
         * Creates an error thrown when the id token extraction errors out.
         * @param err
         */
        ClientAuthError.createTokenParsingError = function (caughtExtractionError) {
            return new ClientAuthError(ClientAuthErrorMessage.tokenParsingError.code, ClientAuthErrorMessage.tokenParsingError.desc + " Failed with error: " + caughtExtractionError);
        };
        /**
         * Creates an error thrown when the id token string is null or empty.
         * @param invalidRawTokenString
         */
        ClientAuthError.createTokenNullOrEmptyError = function (invalidRawTokenString) {
            return new ClientAuthError(ClientAuthErrorMessage.nullOrEmptyToken.code, ClientAuthErrorMessage.nullOrEmptyToken.desc + " Raw Token Value: " + invalidRawTokenString);
        };
        /**
         * Creates an error thrown when the endpoint discovery doesn't complete correctly.
         */
        ClientAuthError.createEndpointDiscoveryIncompleteError = function (errDetail) {
            return new ClientAuthError(ClientAuthErrorMessage.endpointResolutionError.code, ClientAuthErrorMessage.endpointResolutionError.desc + " Detail: " + errDetail);
        };
        /**
         * Creates an error thrown when the fetch client throws
         */
        ClientAuthError.createNetworkError = function (endpoint, errDetail) {
            return new ClientAuthError(ClientAuthErrorMessage.networkError.code, ClientAuthErrorMessage.networkError.desc + " | Fetch client threw: " + errDetail + " | Attempted to reach: " + endpoint.split("?")[0]);
        };
        /**
         * Creates an error thrown when the openid-configuration endpoint cannot be reached or does not contain the required data
         */
        ClientAuthError.createUnableToGetOpenidConfigError = function (errDetail) {
            return new ClientAuthError(ClientAuthErrorMessage.unableToGetOpenidConfigError.code, ClientAuthErrorMessage.unableToGetOpenidConfigError.desc + " Attempted to retrieve endpoints from: " + errDetail);
        };
        /**
         * Creates an error thrown when the hash cannot be deserialized.
         * @param hashParamObj
         */
        ClientAuthError.createHashNotDeserializedError = function (hashParamObj) {
            return new ClientAuthError(ClientAuthErrorMessage.hashNotDeserialized.code, ClientAuthErrorMessage.hashNotDeserialized.desc + " Given Object: " + hashParamObj);
        };
        /**
         * Creates an error thrown when the state cannot be parsed.
         * @param invalidState
         */
        ClientAuthError.createInvalidStateError = function (invalidState, errorString) {
            return new ClientAuthError(ClientAuthErrorMessage.invalidStateError.code, ClientAuthErrorMessage.invalidStateError.desc + " Invalid State: " + invalidState + ", Root Err: " + errorString);
        };
        /**
         * Creates an error thrown when two states do not match.
         */
        ClientAuthError.createStateMismatchError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.stateMismatchError.code, ClientAuthErrorMessage.stateMismatchError.desc);
        };
        /**
         * Creates an error thrown when the state is not present
         * @param missingState
         */
        ClientAuthError.createStateNotFoundError = function (missingState) {
            return new ClientAuthError(ClientAuthErrorMessage.stateNotFoundError.code, ClientAuthErrorMessage.stateNotFoundError.desc + ":  " + missingState);
        };
        /**
         * Creates an error thrown when the nonce does not match.
         */
        ClientAuthError.createNonceMismatchError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.nonceMismatchError.code, ClientAuthErrorMessage.nonceMismatchError.desc);
        };
        /**
         * Creates an error thrown when the mnonce is not present
         * @param missingNonce
         */
        ClientAuthError.createNonceNotFoundError = function (missingNonce) {
            return new ClientAuthError(ClientAuthErrorMessage.nonceNotFoundError.code, ClientAuthErrorMessage.nonceNotFoundError.desc + ":  " + missingNonce);
        };
        /**
         * Creates an error thrown when the authorization code required for a token request is null or empty.
         */
        ClientAuthError.createNoTokensFoundError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.noTokensFoundError.code, ClientAuthErrorMessage.noTokensFoundError.desc);
        };
        /**
         * Throws error when multiple tokens are in cache.
         */
        ClientAuthError.createMultipleMatchingTokensInCacheError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.multipleMatchingTokens.code, ClientAuthErrorMessage.multipleMatchingTokens.desc + ".");
        };
        /**
         * Throws error when multiple accounts are in cache for the given params
         */
        ClientAuthError.createMultipleMatchingAccountsInCacheError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.multipleMatchingAccounts.code, ClientAuthErrorMessage.multipleMatchingAccounts.desc);
        };
        /**
         * Throws error when multiple appMetada are in cache for the given clientId.
         */
        ClientAuthError.createMultipleMatchingAppMetadataInCacheError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.multipleMatchingAppMetadata.code, ClientAuthErrorMessage.multipleMatchingAppMetadata.desc);
        };
        /**
         * Throws error when no auth code or refresh token is given to ServerTokenRequestParameters.
         */
        ClientAuthError.createTokenRequestCannotBeMadeError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.tokenRequestCannotBeMade.code, ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
        };
        /**
         * Throws error when attempting to append a null, undefined or empty scope to a set
         * @param givenScope
         */
        ClientAuthError.createAppendEmptyScopeToSetError = function (givenScope) {
            return new ClientAuthError(ClientAuthErrorMessage.appendEmptyScopeError.code, ClientAuthErrorMessage.appendEmptyScopeError.desc + " Given Scope: " + givenScope);
        };
        /**
         * Throws error when attempting to append a null, undefined or empty scope to a set
         * @param givenScope
         */
        ClientAuthError.createRemoveEmptyScopeFromSetError = function (givenScope) {
            return new ClientAuthError(ClientAuthErrorMessage.removeEmptyScopeError.code, ClientAuthErrorMessage.removeEmptyScopeError.desc + " Given Scope: " + givenScope);
        };
        /**
         * Throws error when attempting to append null or empty ScopeSet.
         * @param appendError
         */
        ClientAuthError.createAppendScopeSetError = function (appendError) {
            return new ClientAuthError(ClientAuthErrorMessage.appendScopeSetError.code, ClientAuthErrorMessage.appendScopeSetError.desc + " Detail Error: " + appendError);
        };
        /**
         * Throws error if ScopeSet is null or undefined.
         * @param givenScopeSet
         */
        ClientAuthError.createEmptyInputScopeSetError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.emptyInputScopeSetError.code, "" + ClientAuthErrorMessage.emptyInputScopeSetError.desc);
        };
        /**
         * Throws error if user sets CancellationToken.cancel = true during polling of token endpoint during device code flow
         */
        ClientAuthError.createDeviceCodeCancelledError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.DeviceCodePollingCancelled.code, "" + ClientAuthErrorMessage.DeviceCodePollingCancelled.desc);
        };
        /**
         * Throws error if device code is expired
         */
        ClientAuthError.createDeviceCodeExpiredError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.DeviceCodeExpired.code, "" + ClientAuthErrorMessage.DeviceCodeExpired.desc);
        };
        /**
         * Throws error if device code is expired
         */
        ClientAuthError.createDeviceCodeUnknownError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.DeviceCodeUnknownError.code, "" + ClientAuthErrorMessage.DeviceCodeUnknownError.desc);
        };
        /**
         * Throws error when silent requests are made without an account object
         */
        ClientAuthError.createNoAccountInSilentRequestError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.NoAccountInSilentRequest.code, "" + ClientAuthErrorMessage.NoAccountInSilentRequest.desc);
        };
        /**
         * Throws error when cache record is null or undefined.
         */
        ClientAuthError.createNullOrUndefinedCacheRecord = function () {
            return new ClientAuthError(ClientAuthErrorMessage.invalidCacheRecord.code, ClientAuthErrorMessage.invalidCacheRecord.desc);
        };
        /**
         * Throws error when provided environment is not part of the CloudDiscoveryMetadata object
         */
        ClientAuthError.createInvalidCacheEnvironmentError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.invalidCacheEnvironment.code, ClientAuthErrorMessage.invalidCacheEnvironment.desc);
        };
        /**
         * Throws error when account is not found in cache.
         */
        ClientAuthError.createNoAccountFoundError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.noAccountFound.code, ClientAuthErrorMessage.noAccountFound.desc);
        };
        /**
         * Throws error if ICachePlugin not set on CacheManager.
         */
        ClientAuthError.createCachePluginError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.CachePluginError.code, "" + ClientAuthErrorMessage.CachePluginError.desc);
        };
        /**
         * Throws error if crypto object not found.
         * @param operationName
         */
        ClientAuthError.createNoCryptoObjectError = function (operationName) {
            return new ClientAuthError(ClientAuthErrorMessage.noCryptoObj.code, "" + ClientAuthErrorMessage.noCryptoObj.desc + operationName);
        };
        /**
         * Throws error if cache type is invalid.
         */
        ClientAuthError.createInvalidCacheTypeError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.invalidCacheType.code, "" + ClientAuthErrorMessage.invalidCacheType.desc);
        };
        /**
         * Throws error if unexpected account type.
         */
        ClientAuthError.createUnexpectedAccountTypeError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.unexpectedAccountType.code, "" + ClientAuthErrorMessage.unexpectedAccountType.desc);
        };
        /**
         * Throws error if unexpected credential type.
         */
        ClientAuthError.createUnexpectedCredentialTypeError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.unexpectedCredentialType.code, "" + ClientAuthErrorMessage.unexpectedCredentialType.desc);
        };
        /**
         * Throws error if client assertion is not valid.
         */
        ClientAuthError.createInvalidAssertionError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.invalidAssertion.code, "" + ClientAuthErrorMessage.invalidAssertion.desc);
        };
        /**
         * Throws error if client assertion is not valid.
         */
        ClientAuthError.createInvalidCredentialError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.invalidClientCredential.code, "" + ClientAuthErrorMessage.invalidClientCredential.desc);
        };
        /**
         * Throws error if token cannot be retrieved from cache due to refresh being required.
         */
        ClientAuthError.createRefreshRequiredError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.tokenRefreshRequired.code, ClientAuthErrorMessage.tokenRefreshRequired.desc);
        };
        /**
         * Throws error if the user defined timeout is reached.
         */
        ClientAuthError.createUserTimeoutReachedError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.userTimeoutReached.code, ClientAuthErrorMessage.userTimeoutReached.desc);
        };
        /*
         * Throws error if token claims are not populated for a signed jwt generation
         */
        ClientAuthError.createTokenClaimsRequiredError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.tokenClaimsRequired.code, ClientAuthErrorMessage.tokenClaimsRequired.desc);
        };
        /**
         * Throws error when the authorization code is missing from the server response
         */
        ClientAuthError.createNoAuthCodeInServerResponseError = function () {
            return new ClientAuthError(ClientAuthErrorMessage.noAuthorizationCodeFromServer.code, ClientAuthErrorMessage.noAuthorizationCodeFromServer.desc);
        };
        return ClientAuthError;
    }(AuthError));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * @hidden
     */
    var StringUtils = /** @class */ (function () {
        function StringUtils() {
        }
        /**
         * decode a JWT
         *
         * @param authToken
         */
        StringUtils.decodeAuthToken = function (authToken) {
            if (StringUtils.isEmpty(authToken)) {
                throw ClientAuthError.createTokenNullOrEmptyError(authToken);
            }
            var tokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
            var matches = tokenPartsRegex.exec(authToken);
            if (!matches || matches.length < 4) {
                throw ClientAuthError.createTokenParsingError("Given token is malformed: " + JSON.stringify(authToken));
            }
            var crackedToken = {
                header: matches[1],
                JWSPayload: matches[2],
                JWSSig: matches[3]
            };
            return crackedToken;
        };
        /**
         * Check if a string is empty.
         *
         * @param str
         */
        StringUtils.isEmpty = function (str) {
            return (typeof str === "undefined" || !str || 0 === str.length);
        };
        /**
         * Check if stringified object is empty
         * @param strObj
         */
        StringUtils.isEmptyObj = function (strObj) {
            if (strObj && !StringUtils.isEmpty(strObj)) {
                try {
                    var obj = JSON.parse(strObj);
                    return Object.keys(obj).length === 0;
                }
                catch (e) { }
            }
            return true;
        };
        StringUtils.startsWith = function (str, search) {
            return str.indexOf(search) === 0;
        };
        StringUtils.endsWith = function (str, search) {
            return (str.length >= search.length) && (str.lastIndexOf(search) === (str.length - search.length));
        };
        /**
         * Parses string into an object.
         *
         * @param query
         */
        StringUtils.queryStringToObject = function (query) {
            var match; // Regex for replacing addition symbol with a space
            var pl = /\+/g;
            var search = /([^&=]+)=([^&]*)/g;
            var decode = function (s) { return decodeURIComponent(decodeURIComponent(s.replace(pl, " "))); };
            var obj = {};
            match = search.exec(query);
            while (match) {
                obj[decode(match[1])] = decode(match[2]);
                match = search.exec(query);
            }
            return obj;
        };
        /**
         * Trims entries in an array.
         *
         * @param arr
         */
        StringUtils.trimArrayEntries = function (arr) {
            return arr.map(function (entry) { return entry.trim(); });
        };
        /**
         * Removes empty strings from array
         * @param arr
         */
        StringUtils.removeEmptyStringsFromArray = function (arr) {
            return arr.filter(function (entry) {
                return !StringUtils.isEmpty(entry);
            });
        };
        /**
         * Attempts to parse a string into JSON
         * @param str
         */
        StringUtils.jsonParseHelper = function (str) {
            try {
                return JSON.parse(str);
            }
            catch (e) {
                return null;
            }
        };
        /**
         * Tests if a given string matches a given pattern, with support for wildcards and queries.
         * @param pattern Wildcard pattern to string match. Supports "*" for wildcards and "?" for queries
         * @param input String to match against
         */
        StringUtils.matchPattern = function (pattern, input) {
            /**
             * Wildcard support: https://stackoverflow.com/a/3117248/4888559
             * Queries: replaces "?" in string with escaped "\?" for regex test
             */
            var regex = new RegExp(pattern.replace(/\*/g, "[^ ]*").replace(/\?/g, "\\\?"));
            return regex.test(input);
        };
        return StringUtils;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Log message level.
     */
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["Error"] = 0] = "Error";
        LogLevel[LogLevel["Warning"] = 1] = "Warning";
        LogLevel[LogLevel["Info"] = 2] = "Info";
        LogLevel[LogLevel["Verbose"] = 3] = "Verbose";
        LogLevel[LogLevel["Trace"] = 4] = "Trace";
    })(LogLevel || (LogLevel = {}));
    /**
     * Class which facilitates logging of messages to a specific place.
     */
    var Logger = /** @class */ (function () {
        function Logger(loggerOptions, packageName, packageVersion) {
            // Current log level, defaults to info.
            this.level = LogLevel.Info;
            var defaultLoggerCallback = function () { };
            this.localCallback = loggerOptions.loggerCallback || defaultLoggerCallback;
            this.piiLoggingEnabled = loggerOptions.piiLoggingEnabled || false;
            this.level = loggerOptions.logLevel || LogLevel.Info;
            this.correlationId = loggerOptions.correlationId || "";
            this.packageName = packageName || Constants.EMPTY_STRING;
            this.packageVersion = packageVersion || Constants.EMPTY_STRING;
        }
        /**
         * Create new Logger with existing configurations.
         */
        Logger.prototype.clone = function (packageName, packageVersion, correlationId) {
            return new Logger({ loggerCallback: this.localCallback, piiLoggingEnabled: this.piiLoggingEnabled, logLevel: this.level, correlationId: correlationId || this.correlationId }, packageName, packageVersion);
        };
        /**
         * Log message with required options.
         */
        Logger.prototype.logMessage = function (logMessage, options) {
            if ((options.logLevel > this.level) || (!this.piiLoggingEnabled && options.containsPii)) {
                return;
            }
            var timestamp = new Date().toUTCString();
            // Add correlationId to logs if set, correlationId provided on log messages take precedence
            var logHeader;
            if (!StringUtils.isEmpty(options.correlationId)) {
                logHeader = "[" + timestamp + "] : [" + options.correlationId + "]";
            }
            else if (!StringUtils.isEmpty(this.correlationId)) {
                logHeader = "[" + timestamp + "] : [" + this.correlationId + "]";
            }
            else {
                logHeader = "[" + timestamp + "]";
            }
            var log = logHeader + " : " + this.packageName + "@" + this.packageVersion + " : " + LogLevel[options.logLevel] + " - " + logMessage;
            // debug(`msal:${LogLevel[options.logLevel]}${options.containsPii ? "-Pii": ""}${options.context ? `:${options.context}` : ""}`)(logMessage);
            this.executeCallback(options.logLevel, log, options.containsPii || false);
        };
        /**
         * Execute callback with message.
         */
        Logger.prototype.executeCallback = function (level, message, containsPii) {
            if (this.localCallback) {
                this.localCallback(level, message, containsPii);
            }
        };
        /**
         * Logs error messages.
         */
        Logger.prototype.error = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Error,
                containsPii: false,
                correlationId: correlationId || ""
            });
        };
        /**
         * Logs error messages with PII.
         */
        Logger.prototype.errorPii = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Error,
                containsPii: true,
                correlationId: correlationId || ""
            });
        };
        /**
         * Logs warning messages.
         */
        Logger.prototype.warning = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Warning,
                containsPii: false,
                correlationId: correlationId || ""
            });
        };
        /**
         * Logs warning messages with PII.
         */
        Logger.prototype.warningPii = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Warning,
                containsPii: true,
                correlationId: correlationId || ""
            });
        };
        /**
         * Logs info messages.
         */
        Logger.prototype.info = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Info,
                containsPii: false,
                correlationId: correlationId || ""
            });
        };
        /**
         * Logs info messages with PII.
         */
        Logger.prototype.infoPii = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Info,
                containsPii: true,
                correlationId: correlationId || ""
            });
        };
        /**
         * Logs verbose messages.
         */
        Logger.prototype.verbose = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Verbose,
                containsPii: false,
                correlationId: correlationId || ""
            });
        };
        /**
         * Logs verbose messages with PII.
         */
        Logger.prototype.verbosePii = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Verbose,
                containsPii: true,
                correlationId: correlationId || ""
            });
        };
        /**
         * Logs trace messages.
         */
        Logger.prototype.trace = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Trace,
                containsPii: false,
                correlationId: correlationId || ""
            });
        };
        /**
         * Logs trace messages with PII.
         */
        Logger.prototype.tracePii = function (message, correlationId) {
            this.logMessage(message, {
                logLevel: LogLevel.Trace,
                containsPii: true,
                correlationId: correlationId || ""
            });
        };
        /**
         * Returns whether PII Logging is enabled or not.
         */
        Logger.prototype.isPiiLoggingEnabled = function () {
            return this.piiLoggingEnabled || false;
        };
        return Logger;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /* eslint-disable header/header */
    var name$1 = "@azure/msal-common";
    var version$1 = "4.4.0";

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Base type for credentials to be stored in the cache: eg: ACCESS_TOKEN, ID_TOKEN etc
     *
     * Key:Value Schema:
     *
     * Key: <home_account_id*>-<environment>-<credential_type>-<client_id>-<realm*>-<target*>
     *
     * Value Schema:
     * {
     *      homeAccountId: home account identifier for the auth scheme,
     *      environment: entity that issued the token, represented as a full host
     *      credentialType: Type of credential as a string, can be one of the following: RefreshToken, AccessToken, IdToken, Password, Cookie, Certificate, Other
     *      clientId: client ID of the application
     *      secret: Actual credential as a string
     *      familyId: Family ID identifier, usually only used for refresh tokens
     *      realm: Full tenant or organizational identifier that the account belongs to
     *      target: Permissions that are included in the token, or for refresh tokens, the resource identifier.
     *      oboAssertion: access token passed in as part of OBO request
     * }
     */
    var CredentialEntity = /** @class */ (function () {
        function CredentialEntity() {
        }
        /**
         * Generate Account Id key component as per the schema: <home_account_id>-<environment>
         */
        CredentialEntity.prototype.generateAccountId = function () {
            return CredentialEntity.generateAccountIdForCacheKey(this.homeAccountId, this.environment);
        };
        /**
         * Generate Credential Id key component as per the schema: <credential_type>-<client_id>-<realm>
         */
        CredentialEntity.prototype.generateCredentialId = function () {
            return CredentialEntity.generateCredentialIdForCacheKey(this.credentialType, this.clientId, this.realm, this.familyId);
        };
        /**
         * Generate target key component as per schema: <target>
         */
        CredentialEntity.prototype.generateTarget = function () {
            return CredentialEntity.generateTargetForCacheKey(this.target);
        };
        /**
         * generates credential key
         */
        CredentialEntity.prototype.generateCredentialKey = function () {
            return CredentialEntity.generateCredentialCacheKey(this.homeAccountId, this.environment, this.credentialType, this.clientId, this.realm, this.target, this.familyId);
        };
        /**
         * returns the type of the cache (in this case credential)
         */
        CredentialEntity.prototype.generateType = function () {
            switch (this.credentialType) {
                case CredentialType.ID_TOKEN:
                    return CacheType.ID_TOKEN;
                case CredentialType.ACCESS_TOKEN:
                    return CacheType.ACCESS_TOKEN;
                case CredentialType.REFRESH_TOKEN:
                    return CacheType.REFRESH_TOKEN;
                default: {
                    throw ClientAuthError.createUnexpectedCredentialTypeError();
                }
            }
        };
        /**
         * helper function to return `CredentialType`
         * @param key
         */
        CredentialEntity.getCredentialType = function (key) {
            // First keyword search will match all "AccessToken" and "AccessToken_With_AuthScheme" credentials
            if (key.indexOf(CredentialType.ACCESS_TOKEN.toLowerCase()) !== -1) {
                // Perform second search to differentiate between "AccessToken" and "AccessToken_With_AuthScheme" credential types
                if (key.indexOf(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase()) !== -1) {
                    return CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
                }
                return CredentialType.ACCESS_TOKEN;
            }
            else if (key.indexOf(CredentialType.ID_TOKEN.toLowerCase()) !== -1) {
                return CredentialType.ID_TOKEN;
            }
            else if (key.indexOf(CredentialType.REFRESH_TOKEN.toLowerCase()) !== -1) {
                return CredentialType.REFRESH_TOKEN;
            }
            return Constants.NOT_DEFINED;
        };
        /**
         * generates credential key
         */
        CredentialEntity.generateCredentialCacheKey = function (homeAccountId, environment, credentialType, clientId, realm, target, familyId) {
            var credentialKey = [
                this.generateAccountIdForCacheKey(homeAccountId, environment),
                this.generateCredentialIdForCacheKey(credentialType, clientId, realm, familyId),
                this.generateTargetForCacheKey(target),
            ];
            return credentialKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
        };
        /**
         * generates Account Id for keys
         * @param homeAccountId
         * @param environment
         */
        CredentialEntity.generateAccountIdForCacheKey = function (homeAccountId, environment) {
            var accountId = [homeAccountId, environment];
            return accountId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
        };
        /**
         * Generates Credential Id for keys
         * @param credentialType
         * @param realm
         * @param clientId
         * @param familyId
         */
        CredentialEntity.generateCredentialIdForCacheKey = function (credentialType, clientId, realm, familyId) {
            var clientOrFamilyId = credentialType === CredentialType.REFRESH_TOKEN
                ? familyId || clientId
                : clientId;
            var credentialId = [
                credentialType,
                clientOrFamilyId,
                realm || "",
            ];
            return credentialId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
        };
        /**
         * Generate target key component as per schema: <target>
         */
        CredentialEntity.generateTargetForCacheKey = function (scopes) {
            return (scopes || "").toLowerCase();
        };
        return CredentialEntity;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * ClientConfigurationErrorMessage class containing string constants used by error codes and messages.
     */
    var ClientConfigurationErrorMessage = {
        redirectUriNotSet: {
            code: "redirect_uri_empty",
            desc: "A redirect URI is required for all calls, and none has been set."
        },
        postLogoutUriNotSet: {
            code: "post_logout_uri_empty",
            desc: "A post logout redirect has not been set."
        },
        claimsRequestParsingError: {
            code: "claims_request_parsing_error",
            desc: "Could not parse the given claims request object."
        },
        authorityUriInsecure: {
            code: "authority_uri_insecure",
            desc: "Authority URIs must use https.  Please see here for valid authority configuration options: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications#configuration-options"
        },
        urlParseError: {
            code: "url_parse_error",
            desc: "URL could not be parsed into appropriate segments."
        },
        urlEmptyError: {
            code: "empty_url_error",
            desc: "URL was empty or null."
        },
        emptyScopesError: {
            code: "empty_input_scopes_error",
            desc: "Scopes cannot be passed as null, undefined or empty array because they are required to obtain an access token."
        },
        nonArrayScopesError: {
            code: "nonarray_input_scopes_error",
            desc: "Scopes cannot be passed as non-array."
        },
        clientIdSingleScopeError: {
            code: "clientid_input_scopes_error",
            desc: "Client ID can only be provided as a single scope."
        },
        invalidPrompt: {
            code: "invalid_prompt_value",
            desc: "Supported prompt values are 'login', 'select_account', 'consent' and 'none'.  Please see here for valid configuration options: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications#configuration-options",
        },
        invalidClaimsRequest: {
            code: "invalid_claims",
            desc: "Given claims parameter must be a stringified JSON object."
        },
        tokenRequestEmptyError: {
            code: "token_request_empty",
            desc: "Token request was empty and not found in cache."
        },
        logoutRequestEmptyError: {
            code: "logout_request_empty",
            desc: "The logout request was null or undefined."
        },
        invalidCodeChallengeMethod: {
            code: "invalid_code_challenge_method",
            desc: "code_challenge_method passed is invalid. Valid values are \"plain\" and \"S256\"."
        },
        invalidCodeChallengeParams: {
            code: "pkce_params_missing",
            desc: "Both params: code_challenge and code_challenge_method are to be passed if to be sent in the request"
        },
        invalidCloudDiscoveryMetadata: {
            code: "invalid_cloud_discovery_metadata",
            desc: "Invalid cloudDiscoveryMetadata provided. Must be a JSON object containing tenant_discovery_endpoint and metadata fields"
        },
        invalidAuthorityMetadata: {
            code: "invalid_authority_metadata",
            desc: "Invalid authorityMetadata provided. Must by a JSON object containing authorization_endpoint, token_endpoint, end_session_endpoint, issuer fields."
        },
        untrustedAuthority: {
            code: "untrusted_authority",
            desc: "The provided authority is not a trusted authority. Please include this authority in the knownAuthorities config parameter."
        }
    };
    /**
     * Error thrown when there is an error in configuration of the MSAL.js library.
     */
    var ClientConfigurationError = /** @class */ (function (_super) {
        __extends(ClientConfigurationError, _super);
        function ClientConfigurationError(errorCode, errorMessage) {
            var _this = _super.call(this, errorCode, errorMessage) || this;
            _this.name = "ClientConfigurationError";
            Object.setPrototypeOf(_this, ClientConfigurationError.prototype);
            return _this;
        }
        /**
         * Creates an error thrown when the redirect uri is empty (not set by caller)
         */
        ClientConfigurationError.createRedirectUriEmptyError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.redirectUriNotSet.code, ClientConfigurationErrorMessage.redirectUriNotSet.desc);
        };
        /**
         * Creates an error thrown when the post-logout redirect uri is empty (not set by caller)
         */
        ClientConfigurationError.createPostLogoutRedirectUriEmptyError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.postLogoutUriNotSet.code, ClientConfigurationErrorMessage.postLogoutUriNotSet.desc);
        };
        /**
         * Creates an error thrown when the claims request could not be successfully parsed
         */
        ClientConfigurationError.createClaimsRequestParsingError = function (claimsRequestParseError) {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.claimsRequestParsingError.code, ClientConfigurationErrorMessage.claimsRequestParsingError.desc + " Given value: " + claimsRequestParseError);
        };
        /**
         * Creates an error thrown if authority uri is given an insecure protocol.
         * @param urlString
         */
        ClientConfigurationError.createInsecureAuthorityUriError = function (urlString) {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.authorityUriInsecure.code, ClientConfigurationErrorMessage.authorityUriInsecure.desc + " Given URI: " + urlString);
        };
        /**
         * Creates an error thrown if URL string does not parse into separate segments.
         * @param urlString
         */
        ClientConfigurationError.createUrlParseError = function (urlParseError) {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.urlParseError.code, ClientConfigurationErrorMessage.urlParseError.desc + " Given Error: " + urlParseError);
        };
        /**
         * Creates an error thrown if URL string is empty or null.
         * @param urlString
         */
        ClientConfigurationError.createUrlEmptyError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.urlEmptyError.code, ClientConfigurationErrorMessage.urlEmptyError.desc);
        };
        /**
         * Error thrown when scopes are empty.
         * @param scopesValue
         */
        ClientConfigurationError.createEmptyScopesArrayError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.emptyScopesError.code, "" + ClientConfigurationErrorMessage.emptyScopesError.desc);
        };
        /**
         * Error thrown when client id scope is not provided as single scope.
         * @param inputScopes
         */
        ClientConfigurationError.createClientIdSingleScopeError = function (inputScopes) {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.clientIdSingleScopeError.code, ClientConfigurationErrorMessage.clientIdSingleScopeError.desc + " Given Scopes: " + inputScopes);
        };
        /**
         * Error thrown when prompt is not an allowed type.
         * @param promptValue
         */
        ClientConfigurationError.createInvalidPromptError = function (promptValue) {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidPrompt.code, ClientConfigurationErrorMessage.invalidPrompt.desc + " Given value: " + promptValue);
        };
        /**
         * Creates error thrown when claims parameter is not a stringified JSON object
         */
        ClientConfigurationError.createInvalidClaimsRequestError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidClaimsRequest.code, ClientConfigurationErrorMessage.invalidClaimsRequest.desc);
        };
        /**
         * Throws error when token request is empty and nothing cached in storage.
         */
        ClientConfigurationError.createEmptyLogoutRequestError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.logoutRequestEmptyError.code, ClientConfigurationErrorMessage.logoutRequestEmptyError.desc);
        };
        /**
         * Throws error when token request is empty and nothing cached in storage.
         */
        ClientConfigurationError.createEmptyTokenRequestError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.tokenRequestEmptyError.code, ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
        };
        /**
         * Throws error when an invalid code_challenge_method is passed by the user
         */
        ClientConfigurationError.createInvalidCodeChallengeMethodError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidCodeChallengeMethod.code, ClientConfigurationErrorMessage.invalidCodeChallengeMethod.desc);
        };
        /**
         * Throws error when both params: code_challenge and code_challenge_method are not passed together
         */
        ClientConfigurationError.createInvalidCodeChallengeParamsError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidCodeChallengeParams.code, ClientConfigurationErrorMessage.invalidCodeChallengeParams.desc);
        };
        /**
         * Throws an error when the user passes invalid cloudDiscoveryMetadata
         */
        ClientConfigurationError.createInvalidCloudDiscoveryMetadataError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidCloudDiscoveryMetadata.code, ClientConfigurationErrorMessage.invalidCloudDiscoveryMetadata.desc);
        };
        /**
         * Throws an error when the user passes invalid cloudDiscoveryMetadata
         */
        ClientConfigurationError.createInvalidAuthorityMetadataError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidAuthorityMetadata.code, ClientConfigurationErrorMessage.invalidAuthorityMetadata.desc);
        };
        /**
         * Throws error when provided authority is not a member of the trusted host list
         */
        ClientConfigurationError.createUntrustedAuthorityError = function () {
            return new ClientConfigurationError(ClientConfigurationErrorMessage.untrustedAuthority.code, ClientConfigurationErrorMessage.untrustedAuthority.desc);
        };
        return ClientConfigurationError;
    }(ClientAuthError));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * The ScopeSet class creates a set of scopes. Scopes are case-insensitive, unique values, so the Set object in JS makes
     * the most sense to implement for this class. All scopes are trimmed and converted to lower case strings in intersection and union functions
     * to ensure uniqueness of strings.
     */
    var ScopeSet = /** @class */ (function () {
        function ScopeSet(inputScopes) {
            var _this = this;
            // Filter empty string and null/undefined array items
            var scopeArr = inputScopes ? StringUtils.trimArrayEntries(__spreadArrays(inputScopes)) : [];
            var filteredInput = scopeArr ? StringUtils.removeEmptyStringsFromArray(scopeArr) : [];
            // Validate and filter scopes (validate function throws if validation fails)
            this.validateInputScopes(filteredInput);
            this.scopes = new Set(); // Iterator in constructor not supported by IE11
            filteredInput.forEach(function (scope) { return _this.scopes.add(scope); });
        }
        /**
         * Factory method to create ScopeSet from space-delimited string
         * @param inputScopeString
         * @param appClientId
         * @param scopesRequired
         */
        ScopeSet.fromString = function (inputScopeString) {
            var scopeString = inputScopeString || "";
            var inputScopes = scopeString.split(" ");
            return new ScopeSet(inputScopes);
        };
        /**
         * Used to validate the scopes input parameter requested  by the developer.
         * @param {Array<string>} inputScopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
         * @param {boolean} scopesRequired - Boolean indicating whether the scopes array is required or not
         */
        ScopeSet.prototype.validateInputScopes = function (inputScopes) {
            // Check if scopes are required but not given or is an empty array
            if (!inputScopes || inputScopes.length < 1) {
                throw ClientConfigurationError.createEmptyScopesArrayError();
            }
        };
        /**
         * Check if a given scope is present in this set of scopes.
         * @param scope
         */
        ScopeSet.prototype.containsScope = function (scope) {
            var lowerCaseScopes = this.printScopesLowerCase().split(" ");
            var lowerCaseScopesSet = new ScopeSet(lowerCaseScopes);
            // compare lowercase scopes
            return !StringUtils.isEmpty(scope) ? lowerCaseScopesSet.scopes.has(scope.toLowerCase()) : false;
        };
        /**
         * Check if a set of scopes is present in this set of scopes.
         * @param scopeSet
         */
        ScopeSet.prototype.containsScopeSet = function (scopeSet) {
            var _this = this;
            if (!scopeSet || scopeSet.scopes.size <= 0) {
                return false;
            }
            return (this.scopes.size >= scopeSet.scopes.size && scopeSet.asArray().every(function (scope) { return _this.containsScope(scope); }));
        };
        /**
         * Check if set of scopes contains only the defaults
         */
        ScopeSet.prototype.containsOnlyOIDCScopes = function () {
            var _this = this;
            var defaultScopeCount = 0;
            OIDC_SCOPES.forEach(function (defaultScope) {
                if (_this.containsScope(defaultScope)) {
                    defaultScopeCount += 1;
                }
            });
            return this.scopes.size === defaultScopeCount;
        };
        /**
         * Appends single scope if passed
         * @param newScope
         */
        ScopeSet.prototype.appendScope = function (newScope) {
            if (!StringUtils.isEmpty(newScope)) {
                this.scopes.add(newScope.trim());
            }
        };
        /**
         * Appends multiple scopes if passed
         * @param newScopes
         */
        ScopeSet.prototype.appendScopes = function (newScopes) {
            var _this = this;
            try {
                newScopes.forEach(function (newScope) { return _this.appendScope(newScope); });
            }
            catch (e) {
                throw ClientAuthError.createAppendScopeSetError(e);
            }
        };
        /**
         * Removes element from set of scopes.
         * @param scope
         */
        ScopeSet.prototype.removeScope = function (scope) {
            if (StringUtils.isEmpty(scope)) {
                throw ClientAuthError.createRemoveEmptyScopeFromSetError(scope);
            }
            this.scopes.delete(scope.trim());
        };
        /**
         * Removes default scopes from set of scopes
         * Primarily used to prevent cache misses if the default scopes are not returned from the server
         */
        ScopeSet.prototype.removeOIDCScopes = function () {
            var _this = this;
            OIDC_SCOPES.forEach(function (defaultScope) {
                _this.scopes.delete(defaultScope);
            });
        };
        /**
         * Combines an array of scopes with the current set of scopes.
         * @param otherScopes
         */
        ScopeSet.prototype.unionScopeSets = function (otherScopes) {
            if (!otherScopes) {
                throw ClientAuthError.createEmptyInputScopeSetError();
            }
            var unionScopes = new Set(); // Iterator in constructor not supported in IE11
            otherScopes.scopes.forEach(function (scope) { return unionScopes.add(scope.toLowerCase()); });
            this.scopes.forEach(function (scope) { return unionScopes.add(scope.toLowerCase()); });
            return unionScopes;
        };
        /**
         * Check if scopes intersect between this set and another.
         * @param otherScopes
         */
        ScopeSet.prototype.intersectingScopeSets = function (otherScopes) {
            if (!otherScopes) {
                throw ClientAuthError.createEmptyInputScopeSetError();
            }
            // Do not allow OIDC scopes to be the only intersecting scopes
            if (!otherScopes.containsOnlyOIDCScopes()) {
                otherScopes.removeOIDCScopes();
            }
            var unionScopes = this.unionScopeSets(otherScopes);
            var sizeOtherScopes = otherScopes.getScopeCount();
            var sizeThisScopes = this.getScopeCount();
            var sizeUnionScopes = unionScopes.size;
            return sizeUnionScopes < (sizeThisScopes + sizeOtherScopes);
        };
        /**
         * Returns size of set of scopes.
         */
        ScopeSet.prototype.getScopeCount = function () {
            return this.scopes.size;
        };
        /**
         * Returns the scopes as an array of string values
         */
        ScopeSet.prototype.asArray = function () {
            var array = [];
            this.scopes.forEach(function (val) { return array.push(val); });
            return array;
        };
        /**
         * Prints scopes into a space-delimited string
         */
        ScopeSet.prototype.printScopes = function () {
            if (this.scopes) {
                var scopeArr = this.asArray();
                return scopeArr.join(" ");
            }
            return "";
        };
        /**
         * Prints scopes into a space-delimited lower-case string (used for caching)
         */
        ScopeSet.prototype.printScopesLowerCase = function () {
            return this.printScopes().toLowerCase();
        };
        return ScopeSet;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Function to build a client info object from server clientInfo string
     * @param rawClientInfo
     * @param crypto
     */
    function buildClientInfo(rawClientInfo, crypto) {
        if (StringUtils.isEmpty(rawClientInfo)) {
            throw ClientAuthError.createClientInfoEmptyError();
        }
        try {
            var decodedClientInfo = crypto.base64Decode(rawClientInfo);
            return JSON.parse(decodedClientInfo);
        }
        catch (e) {
            throw ClientAuthError.createClientInfoDecodingError(e);
        }
    }
    /**
     * Function to build a client info object from cached homeAccountId string
     * @param homeAccountId
     */
    function buildClientInfoFromHomeAccountId(homeAccountId) {
        if (StringUtils.isEmpty(homeAccountId)) {
            throw ClientAuthError.createClientInfoDecodingError("Home account ID was empty.");
        }
        var clientInfoParts = homeAccountId.split(Separators.CLIENT_INFO_SEPARATOR, 2);
        return {
            uid: clientInfoParts[0],
            utid: clientInfoParts.length < 2 ? Constants.EMPTY_STRING : clientInfoParts[1]
        };
    }

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Authority types supported by MSAL.
     */
    var AuthorityType;
    (function (AuthorityType) {
        AuthorityType[AuthorityType["Default"] = 0] = "Default";
        AuthorityType[AuthorityType["Adfs"] = 1] = "Adfs";
    })(AuthorityType || (AuthorityType = {}));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Type that defines required and optional parameters for an Account field (based on universal cache schema implemented by all MSALs).
     *
     * Key : Value Schema
     *
     * Key: <home_account_id>-<environment>-<realm*>
     *
     * Value Schema:
     * {
     *      homeAccountId: home account identifier for the auth scheme,
     *      environment: entity that issued the token, represented as a full host
     *      realm: Full tenant or organizational identifier that the account belongs to
     *      localAccountId: Original tenant-specific accountID, usually used for legacy cases
     *      username: primary username that represents the user, usually corresponds to preferred_username in the v2 endpt
     *      authorityType: Accounts authority type as a string
     *      name: Full name for the account, including given name and family name,
     *      clientInfo: Full base64 encoded client info received from ESTS
     *      lastModificationTime: last time this entity was modified in the cache
     *      lastModificationApp:
     *      oboAssertion: access token passed in as part of OBO request
     *      idTokenClaims: Object containing claims parsed from ID token
     * }
     */
    var AccountEntity = /** @class */ (function () {
        function AccountEntity() {
        }
        /**
         * Generate Account Id key component as per the schema: <home_account_id>-<environment>
         */
        AccountEntity.prototype.generateAccountId = function () {
            var accountId = [this.homeAccountId, this.environment];
            return accountId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
        };
        /**
         * Generate Account Cache Key as per the schema: <home_account_id>-<environment>-<realm*>
         */
        AccountEntity.prototype.generateAccountKey = function () {
            return AccountEntity.generateAccountCacheKey({
                homeAccountId: this.homeAccountId,
                environment: this.environment,
                tenantId: this.realm,
                username: this.username,
                localAccountId: this.localAccountId
            });
        };
        /**
         * returns the type of the cache (in this case account)
         */
        AccountEntity.prototype.generateType = function () {
            switch (this.authorityType) {
                case CacheAccountType.ADFS_ACCOUNT_TYPE:
                    return CacheType.ADFS;
                case CacheAccountType.MSAV1_ACCOUNT_TYPE:
                    return CacheType.MSA;
                case CacheAccountType.MSSTS_ACCOUNT_TYPE:
                    return CacheType.MSSTS;
                case CacheAccountType.GENERIC_ACCOUNT_TYPE:
                    return CacheType.GENERIC;
                default: {
                    throw ClientAuthError.createUnexpectedAccountTypeError();
                }
            }
        };
        /**
         * Returns the AccountInfo interface for this account.
         */
        AccountEntity.prototype.getAccountInfo = function () {
            return {
                homeAccountId: this.homeAccountId,
                environment: this.environment,
                tenantId: this.realm,
                username: this.username,
                localAccountId: this.localAccountId,
                name: this.name,
                idTokenClaims: this.idTokenClaims
            };
        };
        /**
         * Generates account key from interface
         * @param accountInterface
         */
        AccountEntity.generateAccountCacheKey = function (accountInterface) {
            var accountKey = [
                accountInterface.homeAccountId,
                accountInterface.environment || "",
                accountInterface.tenantId || "",
            ];
            return accountKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
        };
        /**
         * Build Account cache from IdToken, clientInfo and authority/policy. Associated with AAD.
         * @param clientInfo
         * @param authority
         * @param idToken
         * @param policy
         */
        AccountEntity.createAccount = function (clientInfo, homeAccountId, authority, idToken, oboAssertion, cloudGraphHostName, msGraphHost) {
            var _a, _b, _c, _d, _e, _f;
            var account = new AccountEntity();
            account.authorityType = CacheAccountType.MSSTS_ACCOUNT_TYPE;
            account.clientInfo = clientInfo;
            account.homeAccountId = homeAccountId;
            var env = authority.getPreferredCache();
            if (StringUtils.isEmpty(env)) {
                throw ClientAuthError.createInvalidCacheEnvironmentError();
            }
            account.environment = env;
            // non AAD scenarios can have empty realm
            account.realm = ((_a = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _a === void 0 ? void 0 : _a.tid) || "";
            account.oboAssertion = oboAssertion;
            if (idToken) {
                account.idTokenClaims = idToken.claims;
                // How do you account for MSA CID here?
                account.localAccountId = ((_b = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _b === void 0 ? void 0 : _b.oid) || ((_c = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _c === void 0 ? void 0 : _c.sub) || "";
                /*
                 * In B2C scenarios the emails claim is used instead of preferred_username and it is an array. In most cases it will contain a single email.
                 * This field should not be relied upon if a custom policy is configured to return more than 1 email.
                 */
                account.username = ((_d = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _d === void 0 ? void 0 : _d.preferred_username) || (((_e = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _e === void 0 ? void 0 : _e.emails) ? idToken.claims.emails[0] : "");
                account.name = (_f = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _f === void 0 ? void 0 : _f.name;
            }
            account.cloudGraphHostName = cloudGraphHostName;
            account.msGraphHost = msGraphHost;
            return account;
        };
        /**
         * Builds non-AAD/ADFS account.
         * @param authority
         * @param idToken
         */
        AccountEntity.createGenericAccount = function (authority, homeAccountId, idToken, oboAssertion, cloudGraphHostName, msGraphHost) {
            var _a, _b, _c, _d;
            var account = new AccountEntity();
            account.authorityType = (authority.authorityType === AuthorityType.Adfs) ? CacheAccountType.ADFS_ACCOUNT_TYPE : CacheAccountType.GENERIC_ACCOUNT_TYPE;
            account.homeAccountId = homeAccountId;
            // non AAD scenarios can have empty realm
            account.realm = "";
            account.oboAssertion = oboAssertion;
            var env = authority.getPreferredCache();
            if (StringUtils.isEmpty(env)) {
                throw ClientAuthError.createInvalidCacheEnvironmentError();
            }
            if (idToken) {
                // How do you account for MSA CID here?
                account.localAccountId = ((_a = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _a === void 0 ? void 0 : _a.oid) || ((_b = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _b === void 0 ? void 0 : _b.sub) || "";
                // upn claim for most ADFS scenarios
                account.username = ((_c = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _c === void 0 ? void 0 : _c.upn) || "";
                account.name = ((_d = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _d === void 0 ? void 0 : _d.name) || "";
                account.idTokenClaims = idToken === null || idToken === void 0 ? void 0 : idToken.claims;
            }
            account.environment = env;
            account.cloudGraphHostName = cloudGraphHostName;
            account.msGraphHost = msGraphHost;
            /*
             * add uniqueName to claims
             * account.name = idToken.claims.uniqueName;
             */
            return account;
        };
        /**
         * Generate HomeAccountId from server response
         * @param serverClientInfo
         * @param authType
         */
        AccountEntity.generateHomeAccountId = function (serverClientInfo, authType, logger, cryptoObj, idToken) {
            var _a;
            var accountId = ((_a = idToken === null || idToken === void 0 ? void 0 : idToken.claims) === null || _a === void 0 ? void 0 : _a.sub) ? idToken.claims.sub : Constants.EMPTY_STRING;
            // since ADFS does not have tid and does not set client_info
            if (authType === AuthorityType.Adfs) {
                return accountId;
            }
            // for cases where there is clientInfo
            if (serverClientInfo) {
                try {
                    var clientInfo = buildClientInfo(serverClientInfo, cryptoObj);
                    if (!StringUtils.isEmpty(clientInfo.uid) && !StringUtils.isEmpty(clientInfo.utid)) {
                        return "" + clientInfo.uid + Separators.CLIENT_INFO_SEPARATOR + clientInfo.utid;
                    }
                }
                catch (e) { }
            }
            // default to "sub" claim
            logger.verbose("No client info in response");
            return accountId;
        };
        /**
         * Validates an entity: checks for all expected params
         * @param entity
         */
        AccountEntity.isAccountEntity = function (entity) {
            if (!entity) {
                return false;
            }
            return (entity.hasOwnProperty("homeAccountId") &&
                entity.hasOwnProperty("environment") &&
                entity.hasOwnProperty("realm") &&
                entity.hasOwnProperty("localAccountId") &&
                entity.hasOwnProperty("username") &&
                entity.hasOwnProperty("authorityType"));
        };
        /**
         * Helper function to determine whether 2 accountInfo objects represent the same account
         * @param accountA
         * @param accountB
         * @param compareClaims - If set to true idTokenClaims will also be compared to determine account equality
         */
        AccountEntity.accountInfoIsEqual = function (accountA, accountB, compareClaims) {
            if (!accountA || !accountB) {
                return false;
            }
            var claimsMatch = true; // default to true so as to not fail comparison below if compareClaims: false
            if (compareClaims) {
                var accountAClaims = (accountA.idTokenClaims || {});
                var accountBClaims = (accountB.idTokenClaims || {});
                // issued at timestamp and nonce are expected to change each time a new id token is acquired
                claimsMatch = (accountAClaims.iat === accountBClaims.iat) &&
                    (accountAClaims.nonce === accountBClaims.nonce);
            }
            return (accountA.homeAccountId === accountB.homeAccountId) &&
                (accountA.localAccountId === accountB.localAccountId) &&
                (accountA.username === accountB.username) &&
                (accountA.tenantId === accountB.tenantId) &&
                (accountA.environment === accountB.environment) &&
                claimsMatch;
        };
        return AccountEntity;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * JWT Token representation class. Parses token string and generates claims object.
     */
    var AuthToken = /** @class */ (function () {
        function AuthToken(rawToken, crypto) {
            if (StringUtils.isEmpty(rawToken)) {
                throw ClientAuthError.createTokenNullOrEmptyError(rawToken);
            }
            this.rawToken = rawToken;
            this.claims = AuthToken.extractTokenClaims(rawToken, crypto);
        }
        /**
         * Extract token by decoding the rawToken
         *
         * @param encodedToken
         */
        AuthToken.extractTokenClaims = function (encodedToken, crypto) {
            var decodedToken = StringUtils.decodeAuthToken(encodedToken);
            // token will be decoded to get the username
            try {
                var base64TokenPayload = decodedToken.JWSPayload;
                // base64Decode() should throw an error if there is an issue
                var base64Decoded = crypto.base64Decode(base64TokenPayload);
                return JSON.parse(base64Decoded);
            }
            catch (err) {
                throw ClientAuthError.createTokenParsingError(err);
            }
        };
        return AuthToken;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Interface class which implement cache storage functions used by MSAL to perform validity checks, and store tokens.
     */
    var CacheManager = /** @class */ (function () {
        function CacheManager(clientId, cryptoImpl) {
            this.clientId = clientId;
            this.cryptoImpl = cryptoImpl;
        }
        /**
         * Returns all accounts in cache
         */
        CacheManager.prototype.getAllAccounts = function () {
            var _this = this;
            var currentAccounts = this.getAccountsFilteredBy();
            var accountValues = Object.keys(currentAccounts).map(function (accountKey) { return currentAccounts[accountKey]; });
            var numAccounts = accountValues.length;
            if (numAccounts < 1) {
                return [];
            }
            else {
                var allAccounts = accountValues.map(function (value) {
                    var accountEntity = CacheManager.toObject(new AccountEntity(), value);
                    var accountInfo = accountEntity.getAccountInfo();
                    var idToken = _this.readIdTokenFromCache(_this.clientId, accountInfo);
                    if (idToken && !accountInfo.idTokenClaims) {
                        accountInfo.idTokenClaims = new AuthToken(idToken.secret, _this.cryptoImpl).claims;
                    }
                    return accountInfo;
                });
                return allAccounts;
            }
        };
        /**
         * saves a cache record
         * @param cacheRecord
         */
        CacheManager.prototype.saveCacheRecord = function (cacheRecord) {
            if (!cacheRecord) {
                throw ClientAuthError.createNullOrUndefinedCacheRecord();
            }
            if (!!cacheRecord.account) {
                this.setAccount(cacheRecord.account);
            }
            if (!!cacheRecord.idToken) {
                this.setIdTokenCredential(cacheRecord.idToken);
            }
            if (!!cacheRecord.accessToken) {
                this.saveAccessToken(cacheRecord.accessToken);
            }
            if (!!cacheRecord.refreshToken) {
                this.setRefreshTokenCredential(cacheRecord.refreshToken);
            }
            if (!!cacheRecord.appMetadata) {
                this.setAppMetadata(cacheRecord.appMetadata);
            }
        };
        /**
         * saves access token credential
         * @param credential
         */
        CacheManager.prototype.saveAccessToken = function (credential) {
            var _this = this;
            var currentTokenCache = this.getCredentialsFilteredBy({
                clientId: credential.clientId,
                credentialType: credential.credentialType,
                environment: credential.environment,
                homeAccountId: credential.homeAccountId,
                realm: credential.realm,
            });
            var currentScopes = ScopeSet.fromString(credential.target);
            var currentAccessTokens = Object.keys(currentTokenCache.accessTokens).map(function (key) { return currentTokenCache.accessTokens[key]; });
            if (currentAccessTokens) {
                currentAccessTokens.forEach(function (tokenEntity) {
                    var tokenScopeSet = ScopeSet.fromString(tokenEntity.target);
                    if (tokenScopeSet.intersectingScopeSets(currentScopes)) {
                        _this.removeCredential(tokenEntity);
                    }
                });
            }
            this.setAccessTokenCredential(credential);
        };
        /**
         * retrieve accounts matching all provided filters; if no filter is set, get all accounts
         * not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
         * @param homeAccountId
         * @param environment
         * @param realm
         */
        CacheManager.prototype.getAccountsFilteredBy = function (accountFilter) {
            return this.getAccountsFilteredByInternal(accountFilter ? accountFilter.homeAccountId : "", accountFilter ? accountFilter.environment : "", accountFilter ? accountFilter.realm : "");
        };
        /**
         * retrieve accounts matching all provided filters; if no filter is set, get all accounts
         * not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
         * @param homeAccountId
         * @param environment
         * @param realm
         */
        CacheManager.prototype.getAccountsFilteredByInternal = function (homeAccountId, environment, realm) {
            var _this = this;
            var allCacheKeys = this.getKeys();
            var matchingAccounts = {};
            allCacheKeys.forEach(function (cacheKey) {
                var entity = _this.getAccount(cacheKey);
                if (!entity) {
                    return;
                }
                if (!!homeAccountId && !_this.matchHomeAccountId(entity, homeAccountId)) {
                    return;
                }
                if (!!environment && !_this.matchEnvironment(entity, environment)) {
                    return;
                }
                if (!!realm && !_this.matchRealm(entity, realm)) {
                    return;
                }
                matchingAccounts[cacheKey] = entity;
            });
            return matchingAccounts;
        };
        /**
         * retrieve credentails matching all provided filters; if no filter is set, get all credentials
         * @param homeAccountId
         * @param environment
         * @param credentialType
         * @param clientId
         * @param realm
         * @param target
         */
        CacheManager.prototype.getCredentialsFilteredBy = function (filter) {
            return this.getCredentialsFilteredByInternal(filter.homeAccountId, filter.environment, filter.credentialType, filter.clientId, filter.familyId, filter.realm, filter.target, filter.oboAssertion);
        };
        /**
         * Support function to help match credentials
         * @param homeAccountId
         * @param environment
         * @param credentialType
         * @param clientId
         * @param realm
         * @param target
         */
        CacheManager.prototype.getCredentialsFilteredByInternal = function (homeAccountId, environment, credentialType, clientId, familyId, realm, target, oboAssertion) {
            var _this = this;
            var allCacheKeys = this.getKeys();
            var matchingCredentials = {
                idTokens: {},
                accessTokens: {},
                refreshTokens: {},
            };
            allCacheKeys.forEach(function (cacheKey) {
                // don't parse any non-credential type cache entities
                var credType = CredentialEntity.getCredentialType(cacheKey);
                if (credType === Constants.NOT_DEFINED) {
                    return;
                }
                // Attempt retrieval
                var entity = _this.getSpecificCredential(cacheKey, credType);
                if (!entity) {
                    return;
                }
                if (!!oboAssertion && !_this.matchOboAssertion(entity, oboAssertion)) {
                    return;
                }
                if (!!homeAccountId && !_this.matchHomeAccountId(entity, homeAccountId)) {
                    return;
                }
                if (!!environment && !_this.matchEnvironment(entity, environment)) {
                    return;
                }
                if (!!realm && !_this.matchRealm(entity, realm)) {
                    return;
                }
                if (!!credentialType && !_this.matchCredentialType(entity, credentialType)) {
                    return;
                }
                if (!!clientId && !_this.matchClientId(entity, clientId)) {
                    return;
                }
                if (!!familyId && !_this.matchFamilyId(entity, familyId)) {
                    return;
                }
                /*
                 * idTokens do not have "target", target specific refreshTokens do exist for some types of authentication
                 * Resource specific refresh tokens case will be added when the support is deemed necessary
                 */
                if (!!target && !_this.matchTarget(entity, target)) {
                    return;
                }
                switch (credType) {
                    case CredentialType.ID_TOKEN:
                        matchingCredentials.idTokens[cacheKey] = entity;
                        break;
                    case CredentialType.ACCESS_TOKEN:
                    case CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME:
                        matchingCredentials.accessTokens[cacheKey] = entity;
                        break;
                    case CredentialType.REFRESH_TOKEN:
                        matchingCredentials.refreshTokens[cacheKey] = entity;
                        break;
                }
            });
            return matchingCredentials;
        };
        /**
         * retrieve appMetadata matching all provided filters; if no filter is set, get all appMetadata
         * @param filter
         */
        CacheManager.prototype.getAppMetadataFilteredBy = function (filter) {
            return this.getAppMetadataFilteredByInternal(filter.environment, filter.clientId);
        };
        /**
         * Support function to help match appMetadata
         * @param environment
         * @param clientId
         */
        CacheManager.prototype.getAppMetadataFilteredByInternal = function (environment, clientId) {
            var _this = this;
            var allCacheKeys = this.getKeys();
            var matchingAppMetadata = {};
            allCacheKeys.forEach(function (cacheKey) {
                // don't parse any non-appMetadata type cache entities
                if (!_this.isAppMetadata(cacheKey)) {
                    return;
                }
                // Attempt retrieval
                var entity = _this.getAppMetadata(cacheKey);
                if (!entity) {
                    return;
                }
                if (!!environment && !_this.matchEnvironment(entity, environment)) {
                    return;
                }
                if (!!clientId && !_this.matchClientId(entity, clientId)) {
                    return;
                }
                matchingAppMetadata[cacheKey] = entity;
            });
            return matchingAppMetadata;
        };
        /**
         * retrieve authorityMetadata that contains a matching alias
         * @param filter
         */
        CacheManager.prototype.getAuthorityMetadataByAlias = function (host) {
            var _this = this;
            var allCacheKeys = this.getAuthorityMetadataKeys();
            var matchedEntity = null;
            allCacheKeys.forEach(function (cacheKey) {
                // don't parse any non-authorityMetadata type cache entities
                if (!_this.isAuthorityMetadata(cacheKey) || cacheKey.indexOf(_this.clientId) === -1) {
                    return;
                }
                // Attempt retrieval
                var entity = _this.getAuthorityMetadata(cacheKey);
                if (!entity) {
                    return;
                }
                if (entity.aliases.indexOf(host) === -1) {
                    return;
                }
                matchedEntity = entity;
            });
            return matchedEntity;
        };
        /**
         * Removes all accounts and related tokens from cache.
         */
        CacheManager.prototype.removeAllAccounts = function () {
            var _this = this;
            var allCacheKeys = this.getKeys();
            allCacheKeys.forEach(function (cacheKey) {
                var entity = _this.getAccount(cacheKey);
                if (!entity) {
                    return;
                }
                _this.removeAccount(cacheKey);
            });
            return true;
        };
        /**
         * returns a boolean if the given account is removed
         * @param account
         */
        CacheManager.prototype.removeAccount = function (accountKey) {
            var account = this.getAccount(accountKey);
            if (!account) {
                throw ClientAuthError.createNoAccountFoundError();
            }
            return (this.removeAccountContext(account) && this.removeItem(accountKey, CacheSchemaType.ACCOUNT));
        };
        /**
         * returns a boolean if the given account is removed
         * @param account
         */
        CacheManager.prototype.removeAccountContext = function (account) {
            var _this = this;
            var allCacheKeys = this.getKeys();
            var accountId = account.generateAccountId();
            allCacheKeys.forEach(function (cacheKey) {
                // don't parse any non-credential type cache entities
                var credType = CredentialEntity.getCredentialType(cacheKey);
                if (credType === Constants.NOT_DEFINED) {
                    return;
                }
                var cacheEntity = _this.getSpecificCredential(cacheKey, credType);
                if (!!cacheEntity && accountId === cacheEntity.generateAccountId()) {
                    _this.removeCredential(cacheEntity);
                }
            });
            return true;
        };
        /**
         * returns a boolean if the given credential is removed
         * @param credential
         */
        CacheManager.prototype.removeCredential = function (credential) {
            var key = credential.generateCredentialKey();
            return this.removeItem(key, CacheSchemaType.CREDENTIAL);
        };
        /**
         * Removes all app metadata objects from cache.
         */
        CacheManager.prototype.removeAppMetadata = function () {
            var _this = this;
            var allCacheKeys = this.getKeys();
            allCacheKeys.forEach(function (cacheKey) {
                if (_this.isAppMetadata(cacheKey)) {
                    _this.removeItem(cacheKey, CacheSchemaType.APP_METADATA);
                }
            });
            return true;
        };
        /**
         * Retrieve the cached credentials into a cacherecord
         * @param account
         * @param clientId
         * @param scopes
         * @param environment
         * @param authScheme
         */
        CacheManager.prototype.readCacheRecord = function (account, clientId, scopes, environment, authScheme) {
            var cachedAccount = this.readAccountFromCache(account);
            var cachedIdToken = this.readIdTokenFromCache(clientId, account);
            var cachedAccessToken = this.readAccessTokenFromCache(clientId, account, scopes, authScheme);
            var cachedRefreshToken = this.readRefreshTokenFromCache(clientId, account, false);
            var cachedAppMetadata = this.readAppMetadataFromCache(environment, clientId);
            if (cachedAccount && cachedIdToken) {
                cachedAccount.idTokenClaims = new AuthToken(cachedIdToken.secret, this.cryptoImpl).claims;
            }
            return {
                account: cachedAccount,
                idToken: cachedIdToken,
                accessToken: cachedAccessToken,
                refreshToken: cachedRefreshToken,
                appMetadata: cachedAppMetadata,
            };
        };
        /**
         * Retrieve AccountEntity from cache
         * @param account
         */
        CacheManager.prototype.readAccountFromCache = function (account) {
            var accountKey = AccountEntity.generateAccountCacheKey(account);
            return this.getAccount(accountKey);
        };
        /**
         * Retrieve IdTokenEntity from cache
         * @param clientId
         * @param account
         * @param inputRealm
         */
        CacheManager.prototype.readIdTokenFromCache = function (clientId, account) {
            var idTokenFilter = {
                homeAccountId: account.homeAccountId,
                environment: account.environment,
                credentialType: CredentialType.ID_TOKEN,
                clientId: clientId,
                realm: account.tenantId,
            };
            var credentialCache = this.getCredentialsFilteredBy(idTokenFilter);
            var idTokens = Object.keys(credentialCache.idTokens).map(function (key) { return credentialCache.idTokens[key]; });
            var numIdTokens = idTokens.length;
            if (numIdTokens < 1) {
                return null;
            }
            else if (numIdTokens > 1) {
                throw ClientAuthError.createMultipleMatchingTokensInCacheError();
            }
            return idTokens[0];
        };
        /**
         * Retrieve AccessTokenEntity from cache
         * @param clientId
         * @param account
         * @param scopes
         * @param authScheme
         */
        CacheManager.prototype.readAccessTokenFromCache = function (clientId, account, scopes, authScheme) {
            var credentialType = (authScheme === AuthenticationScheme.POP) ? CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME : CredentialType.ACCESS_TOKEN;
            var accessTokenFilter = {
                homeAccountId: account.homeAccountId,
                environment: account.environment,
                credentialType: credentialType,
                clientId: clientId,
                realm: account.tenantId,
                target: scopes.printScopesLowerCase(),
            };
            var credentialCache = this.getCredentialsFilteredBy(accessTokenFilter);
            var accessTokens = Object.keys(credentialCache.accessTokens).map(function (key) { return credentialCache.accessTokens[key]; });
            var numAccessTokens = accessTokens.length;
            if (numAccessTokens < 1) {
                return null;
            }
            else if (numAccessTokens > 1) {
                throw ClientAuthError.createMultipleMatchingTokensInCacheError();
            }
            return accessTokens[0];
        };
        /**
         * Helper to retrieve the appropriate refresh token from cache
         * @param clientId
         * @param account
         * @param familyRT
         */
        CacheManager.prototype.readRefreshTokenFromCache = function (clientId, account, familyRT) {
            var id = familyRT ? THE_FAMILY_ID : undefined;
            var refreshTokenFilter = {
                homeAccountId: account.homeAccountId,
                environment: account.environment,
                credentialType: CredentialType.REFRESH_TOKEN,
                clientId: clientId,
                familyId: id
            };
            var credentialCache = this.getCredentialsFilteredBy(refreshTokenFilter);
            var refreshTokens = Object.keys(credentialCache.refreshTokens).map(function (key) { return credentialCache.refreshTokens[key]; });
            var numRefreshTokens = refreshTokens.length;
            if (numRefreshTokens < 1) {
                return null;
            }
            // address the else case after remove functions address environment aliases
            return refreshTokens[0];
        };
        /**
         * Retrieve AppMetadataEntity from cache
         */
        CacheManager.prototype.readAppMetadataFromCache = function (environment, clientId) {
            var appMetadataFilter = {
                environment: environment,
                clientId: clientId,
            };
            var appMetadata = this.getAppMetadataFilteredBy(appMetadataFilter);
            var appMetadataEntries = Object.keys(appMetadata).map(function (key) { return appMetadata[key]; });
            var numAppMetadata = appMetadataEntries.length;
            if (numAppMetadata < 1) {
                return null;
            }
            else if (numAppMetadata > 1) {
                throw ClientAuthError.createMultipleMatchingAppMetadataInCacheError();
            }
            return appMetadataEntries[0];
        };
        /**
         * Return the family_id value associated  with FOCI
         * @param environment
         * @param clientId
         */
        CacheManager.prototype.isAppMetadataFOCI = function (environment, clientId) {
            var appMetadata = this.readAppMetadataFromCache(environment, clientId);
            return !!(appMetadata && appMetadata.familyId === THE_FAMILY_ID);
        };
        /**
         * helper to match account ids
         * @param value
         * @param homeAccountId
         */
        CacheManager.prototype.matchHomeAccountId = function (entity, homeAccountId) {
            return !!(entity.homeAccountId && homeAccountId === entity.homeAccountId);
        };
        /**
         * helper to match assertion
         * @param value
         * @param oboAssertion
         */
        CacheManager.prototype.matchOboAssertion = function (entity, oboAssertion) {
            return !!(entity.oboAssertion && oboAssertion === entity.oboAssertion);
        };
        /**
         * helper to match environment
         * @param value
         * @param environment
         */
        CacheManager.prototype.matchEnvironment = function (entity, environment) {
            var cloudMetadata = this.getAuthorityMetadataByAlias(environment);
            if (cloudMetadata && cloudMetadata.aliases.indexOf(entity.environment) > -1) {
                return true;
            }
            return false;
        };
        /**
         * helper to match credential type
         * @param entity
         * @param credentialType
         */
        CacheManager.prototype.matchCredentialType = function (entity, credentialType) {
            return (entity.credentialType && credentialType.toLowerCase() === entity.credentialType.toLowerCase());
        };
        /**
         * helper to match client ids
         * @param entity
         * @param clientId
         */
        CacheManager.prototype.matchClientId = function (entity, clientId) {
            return !!(entity.clientId && clientId === entity.clientId);
        };
        /**
         * helper to match family ids
         * @param entity
         * @param familyId
         */
        CacheManager.prototype.matchFamilyId = function (entity, familyId) {
            return !!(entity.familyId && familyId === entity.familyId);
        };
        /**
         * helper to match realm
         * @param entity
         * @param realm
         */
        CacheManager.prototype.matchRealm = function (entity, realm) {
            return !!(entity.realm && realm === entity.realm);
        };
        /**
         * Returns true if the target scopes are a subset of the current entity's scopes, false otherwise.
         * @param entity
         * @param target
         */
        CacheManager.prototype.matchTarget = function (entity, target) {
            var isNotAccessTokenCredential = (entity.credentialType !== CredentialType.ACCESS_TOKEN && entity.credentialType !== CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
            if (isNotAccessTokenCredential || !entity.target) {
                return false;
            }
            var entityScopeSet = ScopeSet.fromString(entity.target);
            var requestTargetScopeSet = ScopeSet.fromString(target);
            if (!requestTargetScopeSet.containsOnlyOIDCScopes()) {
                requestTargetScopeSet.removeOIDCScopes(); // ignore OIDC scopes
            }
            else {
                requestTargetScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);
            }
            return entityScopeSet.containsScopeSet(requestTargetScopeSet);
        };
        /**
         * returns if a given cache entity is of the type appmetadata
         * @param key
         */
        CacheManager.prototype.isAppMetadata = function (key) {
            return key.indexOf(APP_METADATA) !== -1;
        };
        /**
         * returns if a given cache entity is of the type authoritymetadata
         * @param key
         */
        CacheManager.prototype.isAuthorityMetadata = function (key) {
            return key.indexOf(AUTHORITY_METADATA_CONSTANTS.CACHE_KEY) !== -1;
        };
        /**
         * returns cache key used for cloud instance metadata
         */
        CacheManager.prototype.generateAuthorityMetadataCacheKey = function (authority) {
            return AUTHORITY_METADATA_CONSTANTS.CACHE_KEY + "-" + this.clientId + "-" + authority;
        };
        /**
         * Returns the specific credential (IdToken/AccessToken/RefreshToken) from the cache
         * @param key
         * @param credType
         */
        CacheManager.prototype.getSpecificCredential = function (key, credType) {
            switch (credType) {
                case CredentialType.ID_TOKEN: {
                    return this.getIdTokenCredential(key);
                }
                case CredentialType.ACCESS_TOKEN:
                case CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME: {
                    return this.getAccessTokenCredential(key);
                }
                case CredentialType.REFRESH_TOKEN: {
                    return this.getRefreshTokenCredential(key);
                }
                default:
                    return null;
            }
        };
        /**
         * Helper to convert serialized data to object
         * @param obj
         * @param json
         */
        CacheManager.toObject = function (obj, json) {
            for (var propertyName in json) {
                obj[propertyName] = json[propertyName];
            }
            return obj;
        };
        return CacheManager;
    }());
    var DefaultStorageClass = /** @class */ (function (_super) {
        __extends(DefaultStorageClass, _super);
        function DefaultStorageClass() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DefaultStorageClass.prototype.setAccount = function () {
            var notImplErr = "Storage interface - setAccount() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getAccount = function () {
            var notImplErr = "Storage interface - getAccount() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.setIdTokenCredential = function () {
            var notImplErr = "Storage interface - setIdTokenCredential() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getIdTokenCredential = function () {
            var notImplErr = "Storage interface - getIdTokenCredential() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.setAccessTokenCredential = function () {
            var notImplErr = "Storage interface - setAccessTokenCredential() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getAccessTokenCredential = function () {
            var notImplErr = "Storage interface - getAccessTokenCredential() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.setRefreshTokenCredential = function () {
            var notImplErr = "Storage interface - setRefreshTokenCredential() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getRefreshTokenCredential = function () {
            var notImplErr = "Storage interface - getRefreshTokenCredential() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.setAppMetadata = function () {
            var notImplErr = "Storage interface - setAppMetadata() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getAppMetadata = function () {
            var notImplErr = "Storage interface - getAppMetadata() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.setServerTelemetry = function () {
            var notImplErr = "Storage interface - setServerTelemetry() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getServerTelemetry = function () {
            var notImplErr = "Storage interface - getServerTelemetry() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.setAuthorityMetadata = function () {
            var notImplErr = "Storage interface - setAuthorityMetadata() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getAuthorityMetadata = function () {
            var notImplErr = "Storage interface - getAuthorityMetadata() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getAuthorityMetadataKeys = function () {
            var notImplErr = "Storage interface - getAuthorityMetadataKeys() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.setThrottlingCache = function () {
            var notImplErr = "Storage interface - setThrottlingCache() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getThrottlingCache = function () {
            var notImplErr = "Storage interface - getThrottlingCache() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.removeItem = function () {
            var notImplErr = "Storage interface - removeItem() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.containsKey = function () {
            var notImplErr = "Storage interface - containsKey() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.getKeys = function () {
            var notImplErr = "Storage interface - getKeys() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        DefaultStorageClass.prototype.clear = function () {
            var notImplErr = "Storage interface - clear() has not been implemented for the cacheStorage interface.";
            throw AuthError.createUnexpectedError(notImplErr);
        };
        return DefaultStorageClass;
    }(CacheManager));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    // Token renewal offset default in seconds
    var DEFAULT_TOKEN_RENEWAL_OFFSET_SEC = 300;
    var DEFAULT_SYSTEM_OPTIONS = {
        tokenRenewalOffsetSeconds: DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
        preventCorsPreflight: false
    };
    var DEFAULT_LOGGER_IMPLEMENTATION = {
        loggerCallback: function () {
            // allow users to not set loggerCallback
        },
        piiLoggingEnabled: false,
        logLevel: LogLevel.Info,
        correlationId: ""
    };
    var DEFAULT_NETWORK_IMPLEMENTATION = {
        sendGetRequestAsync: function () {
            return __awaiter(this, void 0, void 0, function () {
                var notImplErr;
                return __generator(this, function (_a) {
                    notImplErr = "Network interface - sendGetRequestAsync() has not been implemented";
                    throw AuthError.createUnexpectedError(notImplErr);
                });
            });
        },
        sendPostRequestAsync: function () {
            return __awaiter(this, void 0, void 0, function () {
                var notImplErr;
                return __generator(this, function (_a) {
                    notImplErr = "Network interface - sendPostRequestAsync() has not been implemented";
                    throw AuthError.createUnexpectedError(notImplErr);
                });
            });
        }
    };
    var DEFAULT_LIBRARY_INFO = {
        sku: Constants.SKU,
        version: version$1,
        cpu: "",
        os: ""
    };
    var DEFAULT_CLIENT_CREDENTIALS = {
        clientSecret: "",
        clientAssertion: undefined
    };
    /**
     * Function that sets the default options when not explicitly configured from app developer
     *
     * @param Configuration
     *
     * @returns Configuration
     */
    function buildClientConfiguration(_a) {
        var userAuthOptions = _a.authOptions, userSystemOptions = _a.systemOptions, userLoggerOption = _a.loggerOptions, storageImplementation = _a.storageInterface, networkImplementation = _a.networkInterface, cryptoImplementation = _a.cryptoInterface, clientCredentials = _a.clientCredentials, libraryInfo = _a.libraryInfo, serverTelemetryManager = _a.serverTelemetryManager, persistencePlugin = _a.persistencePlugin, serializableCache = _a.serializableCache;
        return {
            authOptions: buildAuthOptions(userAuthOptions),
            systemOptions: __assign(__assign({}, DEFAULT_SYSTEM_OPTIONS), userSystemOptions),
            loggerOptions: __assign(__assign({}, DEFAULT_LOGGER_IMPLEMENTATION), userLoggerOption),
            storageInterface: storageImplementation || new DefaultStorageClass(userAuthOptions.clientId, DEFAULT_CRYPTO_IMPLEMENTATION),
            networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
            cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION,
            clientCredentials: clientCredentials || DEFAULT_CLIENT_CREDENTIALS,
            libraryInfo: __assign(__assign({}, DEFAULT_LIBRARY_INFO), libraryInfo),
            serverTelemetryManager: serverTelemetryManager || null,
            persistencePlugin: persistencePlugin || null,
            serializableCache: serializableCache || null
        };
    }
    /**
     * Construct authoptions from the client and platform passed values
     * @param authOptions
     */
    function buildAuthOptions(authOptions) {
        return __assign({ clientCapabilities: [] }, authOptions);
    }

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Error thrown when there is an error with the server code, for example, unavailability.
     */
    var ServerError = /** @class */ (function (_super) {
        __extends(ServerError, _super);
        function ServerError(errorCode, errorMessage, subError) {
            var _this = _super.call(this, errorCode, errorMessage, subError) || this;
            _this.name = "ServerError";
            Object.setPrototypeOf(_this, ServerError.prototype);
            return _this;
        }
        return ServerError;
    }(AuthError));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var ThrottlingUtils = /** @class */ (function () {
        function ThrottlingUtils() {
        }
        /**
         * Prepares a RequestThumbprint to be stored as a key.
         * @param thumbprint
         */
        ThrottlingUtils.generateThrottlingStorageKey = function (thumbprint) {
            return ThrottlingConstants.THROTTLING_PREFIX + "." + JSON.stringify(thumbprint);
        };
        /**
         * Performs necessary throttling checks before a network request.
         * @param cacheManager
         * @param thumbprint
         */
        ThrottlingUtils.preProcess = function (cacheManager, thumbprint) {
            var _a;
            var key = ThrottlingUtils.generateThrottlingStorageKey(thumbprint);
            var value = cacheManager.getThrottlingCache(key);
            if (value) {
                if (value.throttleTime < Date.now()) {
                    cacheManager.removeItem(key, CacheSchemaType.THROTTLING);
                    return;
                }
                throw new ServerError(((_a = value.errorCodes) === null || _a === void 0 ? void 0 : _a.join(" ")) || Constants.EMPTY_STRING, value.errorMessage, value.subError);
            }
        };
        /**
         * Performs necessary throttling checks after a network request.
         * @param cacheManager
         * @param thumbprint
         * @param response
         */
        ThrottlingUtils.postProcess = function (cacheManager, thumbprint, response) {
            if (ThrottlingUtils.checkResponseStatus(response) || ThrottlingUtils.checkResponseForRetryAfter(response)) {
                var thumbprintValue = {
                    throttleTime: ThrottlingUtils.calculateThrottleTime(parseInt(response.headers[HeaderNames.RETRY_AFTER])),
                    error: response.body.error,
                    errorCodes: response.body.error_codes,
                    errorMessage: response.body.error_description,
                    subError: response.body.suberror
                };
                cacheManager.setThrottlingCache(ThrottlingUtils.generateThrottlingStorageKey(thumbprint), thumbprintValue);
            }
        };
        /**
         * Checks a NetworkResponse object's status codes against 429 or 5xx
         * @param response
         */
        ThrottlingUtils.checkResponseStatus = function (response) {
            return response.status === 429 || response.status >= 500 && response.status < 600;
        };
        /**
         * Checks a NetworkResponse object's RetryAfter header
         * @param response
         */
        ThrottlingUtils.checkResponseForRetryAfter = function (response) {
            if (response.headers) {
                return response.headers.hasOwnProperty(HeaderNames.RETRY_AFTER) && (response.status < 200 || response.status >= 300);
            }
            return false;
        };
        /**
         * Calculates the Unix-time value for a throttle to expire given throttleTime in seconds.
         * @param throttleTime
         */
        ThrottlingUtils.calculateThrottleTime = function (throttleTime) {
            var time = throttleTime <= 0 ? 0 : throttleTime;
            var currentSeconds = Date.now() / 1000;
            return Math.floor(Math.min(currentSeconds + (time || ThrottlingConstants.DEFAULT_THROTTLE_TIME_SECONDS), currentSeconds + ThrottlingConstants.DEFAULT_MAX_THROTTLE_TIME_SECONDS) * 1000);
        };
        ThrottlingUtils.removeThrottle = function (cacheManager, clientId, authority, scopes, homeAccountIdentifier) {
            var thumbprint = {
                clientId: clientId,
                authority: authority,
                scopes: scopes,
                homeAccountIdentifier: homeAccountIdentifier
            };
            var key = this.generateThrottlingStorageKey(thumbprint);
            return cacheManager.removeItem(key, CacheSchemaType.THROTTLING);
        };
        return ThrottlingUtils;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var NetworkManager = /** @class */ (function () {
        function NetworkManager(networkClient, cacheManager) {
            this.networkClient = networkClient;
            this.cacheManager = cacheManager;
        }
        /**
         * Wraps sendPostRequestAsync with necessary preflight and postflight logic
         * @param thumbprint
         * @param tokenEndpoint
         * @param options
         */
        NetworkManager.prototype.sendPostRequest = function (thumbprint, tokenEndpoint, options) {
            return __awaiter(this, void 0, void 0, function () {
                var response, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ThrottlingUtils.preProcess(this.cacheManager, thumbprint);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.networkClient.sendPostRequestAsync(tokenEndpoint, options)];
                        case 2:
                            response = _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _a.sent();
                            if (e_1 instanceof AuthError) {
                                throw e_1;
                            }
                            else {
                                throw ClientAuthError.createNetworkError(tokenEndpoint, e_1);
                            }
                        case 4:
                            ThrottlingUtils.postProcess(this.cacheManager, thumbprint, response);
                            return [2 /*return*/, response];
                    }
                });
            });
        };
        return NetworkManager;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var CcsCredentialType;
    (function (CcsCredentialType) {
        CcsCredentialType["HOME_ACCOUNT_ID"] = "home_account_id";
        CcsCredentialType["UPN"] = "UPN";
    })(CcsCredentialType || (CcsCredentialType = {}));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Base application class which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
     */
    var BaseClient = /** @class */ (function () {
        function BaseClient(configuration) {
            // Set the configuration
            this.config = buildClientConfiguration(configuration);
            // Initialize the logger
            this.logger = new Logger(this.config.loggerOptions, name$1, version$1);
            // Initialize crypto
            this.cryptoUtils = this.config.cryptoInterface;
            // Initialize storage interface
            this.cacheManager = this.config.storageInterface;
            // Set the network interface
            this.networkClient = this.config.networkInterface;
            // Set the NetworkManager
            this.networkManager = new NetworkManager(this.networkClient, this.cacheManager);
            // Set TelemetryManager
            this.serverTelemetryManager = this.config.serverTelemetryManager;
            // set Authority
            this.authority = this.config.authOptions.authority;
        }
        /**
         * Creates default headers for requests to token endpoint
         */
        BaseClient.prototype.createTokenRequestHeaders = function (ccsCred) {
            var headers = {};
            headers[HeaderNames.CONTENT_TYPE] = Constants.URL_FORM_CONTENT_TYPE;
            if (!this.config.systemOptions.preventCorsPreflight && ccsCred) {
                switch (ccsCred.type) {
                    case CcsCredentialType.HOME_ACCOUNT_ID:
                        try {
                            var clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
                            headers[HeaderNames.CCS_HEADER] = "Oid:" + clientInfo.uid + "@" + clientInfo.utid;
                        }
                        catch (e) {
                            this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                        }
                        break;
                    case CcsCredentialType.UPN:
                        headers[HeaderNames.CCS_HEADER] = "UPN: " + ccsCred.credential;
                        break;
                }
            }
            return headers;
        };
        /**
         * Http post to token endpoint
         * @param tokenEndpoint
         * @param queryString
         * @param headers
         * @param thumbprint
         */
        BaseClient.prototype.executePostToTokenEndpoint = function (tokenEndpoint, queryString, headers, thumbprint) {
            return __awaiter(this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.networkManager.sendPostRequest(thumbprint, tokenEndpoint, { body: queryString, headers: headers })];
                        case 1:
                            response = _a.sent();
                            if (this.config.serverTelemetryManager && response.status < 500 && response.status !== 429) {
                                // Telemetry data successfully logged by server, clear Telemetry cache
                                this.config.serverTelemetryManager.clearTelemetryCache();
                            }
                            return [2 /*return*/, response];
                    }
                });
            });
        };
        /**
         * Updates the authority object of the client. Endpoint discovery must be completed.
         * @param updatedAuthority
         */
        BaseClient.prototype.updateAuthority = function (updatedAuthority) {
            if (!updatedAuthority.discoveryComplete()) {
                throw ClientAuthError.createEndpointDiscoveryIncompleteError("Updated authority has not completed endpoint discovery.");
            }
            this.authority = updatedAuthority;
        };
        return BaseClient;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Validates server consumable params from the "request" objects
     */
    var RequestValidator = /** @class */ (function () {
        function RequestValidator() {
        }
        /**
         * Utility to check if the `redirectUri` in the request is a non-null value
         * @param redirectUri
         */
        RequestValidator.validateRedirectUri = function (redirectUri) {
            if (StringUtils.isEmpty(redirectUri)) {
                throw ClientConfigurationError.createRedirectUriEmptyError();
            }
        };
        /**
         * Utility to validate prompt sent by the user in the request
         * @param prompt
         */
        RequestValidator.validatePrompt = function (prompt) {
            if ([
                PromptValue.LOGIN,
                PromptValue.SELECT_ACCOUNT,
                PromptValue.CONSENT,
                PromptValue.NONE
            ].indexOf(prompt) < 0) {
                throw ClientConfigurationError.createInvalidPromptError(prompt);
            }
        };
        RequestValidator.validateClaims = function (claims) {
            try {
                JSON.parse(claims);
            }
            catch (e) {
                throw ClientConfigurationError.createInvalidClaimsRequestError();
            }
        };
        /**
         * Utility to validate code_challenge and code_challenge_method
         * @param codeChallenge
         * @param codeChallengeMethod
         */
        RequestValidator.validateCodeChallengeParams = function (codeChallenge, codeChallengeMethod) {
            if (StringUtils.isEmpty(codeChallenge) || StringUtils.isEmpty(codeChallengeMethod)) {
                throw ClientConfigurationError.createInvalidCodeChallengeParamsError();
            }
            else {
                this.validateCodeChallengeMethod(codeChallengeMethod);
            }
        };
        /**
         * Utility to validate code_challenge_method
         * @param codeChallengeMethod
         */
        RequestValidator.validateCodeChallengeMethod = function (codeChallengeMethod) {
            if ([
                CodeChallengeMethodValues.PLAIN,
                CodeChallengeMethodValues.S256
            ].indexOf(codeChallengeMethod) < 0) {
                throw ClientConfigurationError.createInvalidCodeChallengeMethodError();
            }
        };
        /**
         * Removes unnecessary or duplicate query parameters from extraQueryParameters
         * @param request
         */
        RequestValidator.sanitizeEQParams = function (eQParams, queryParams) {
            if (!eQParams) {
                return {};
            }
            // Remove any query parameters already included in SSO params
            queryParams.forEach(function (value, key) {
                if (eQParams[key]) {
                    delete eQParams[key];
                }
            });
            return eQParams;
        };
        return RequestValidator;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var RequestParameterBuilder = /** @class */ (function () {
        function RequestParameterBuilder() {
            this.parameters = new Map();
        }
        /**
         * add response_type = code
         */
        RequestParameterBuilder.prototype.addResponseTypeCode = function () {
            this.parameters.set(AADServerParamKeys.RESPONSE_TYPE, encodeURIComponent(Constants.CODE_RESPONSE_TYPE));
        };
        /**
         * add response_mode. defaults to query.
         * @param responseMode
         */
        RequestParameterBuilder.prototype.addResponseMode = function (responseMode) {
            this.parameters.set(AADServerParamKeys.RESPONSE_MODE, encodeURIComponent((responseMode) ? responseMode : ResponseMode.QUERY));
        };
        /**
         * add scopes. set addOidcScopes to false to prevent default scopes in non-user scenarios
         * @param scopeSet
         * @param addOidcScopes
         */
        RequestParameterBuilder.prototype.addScopes = function (scopes, addOidcScopes) {
            if (addOidcScopes === void 0) { addOidcScopes = true; }
            var requestScopes = addOidcScopes ? __spreadArrays(scopes || [], OIDC_DEFAULT_SCOPES) : scopes || [];
            var scopeSet = new ScopeSet(requestScopes);
            this.parameters.set(AADServerParamKeys.SCOPE, encodeURIComponent(scopeSet.printScopes()));
        };
        /**
         * add clientId
         * @param clientId
         */
        RequestParameterBuilder.prototype.addClientId = function (clientId) {
            this.parameters.set(AADServerParamKeys.CLIENT_ID, encodeURIComponent(clientId));
        };
        /**
         * add redirect_uri
         * @param redirectUri
         */
        RequestParameterBuilder.prototype.addRedirectUri = function (redirectUri) {
            RequestValidator.validateRedirectUri(redirectUri);
            this.parameters.set(AADServerParamKeys.REDIRECT_URI, encodeURIComponent(redirectUri));
        };
        /**
         * add post logout redirectUri
         * @param redirectUri
         */
        RequestParameterBuilder.prototype.addPostLogoutRedirectUri = function (redirectUri) {
            RequestValidator.validateRedirectUri(redirectUri);
            this.parameters.set(AADServerParamKeys.POST_LOGOUT_URI, encodeURIComponent(redirectUri));
        };
        /**
         * add id_token_hint to logout request
         * @param idTokenHint
         */
        RequestParameterBuilder.prototype.addIdTokenHint = function (idTokenHint) {
            this.parameters.set(AADServerParamKeys.ID_TOKEN_HINT, encodeURIComponent(idTokenHint));
        };
        /**
         * add domain_hint
         * @param domainHint
         */
        RequestParameterBuilder.prototype.addDomainHint = function (domainHint) {
            this.parameters.set(SSOTypes.DOMAIN_HINT, encodeURIComponent(domainHint));
        };
        /**
         * add login_hint
         * @param loginHint
         */
        RequestParameterBuilder.prototype.addLoginHint = function (loginHint) {
            this.parameters.set(SSOTypes.LOGIN_HINT, encodeURIComponent(loginHint));
        };
        /**
         * Adds the CCS (Cache Credential Service) query parameter for login_hint
         * @param loginHint
         */
        RequestParameterBuilder.prototype.addCcsUpn = function (loginHint) {
            this.parameters.set(HeaderNames.CCS_HEADER, encodeURIComponent("UPN:" + loginHint));
        };
        /**
         * Adds the CCS (Cache Credential Service) query parameter for account object
         * @param loginHint
         */
        RequestParameterBuilder.prototype.addCcsOid = function (clientInfo) {
            this.parameters.set(HeaderNames.CCS_HEADER, encodeURIComponent("Oid:" + clientInfo.uid + "@" + clientInfo.utid));
        };
        /**
         * add sid
         * @param sid
         */
        RequestParameterBuilder.prototype.addSid = function (sid) {
            this.parameters.set(SSOTypes.SID, encodeURIComponent(sid));
        };
        /**
         * add claims
         * @param claims
         */
        RequestParameterBuilder.prototype.addClaims = function (claims, clientCapabilities) {
            var mergedClaims = this.addClientCapabilitiesToClaims(claims, clientCapabilities);
            RequestValidator.validateClaims(mergedClaims);
            this.parameters.set(AADServerParamKeys.CLAIMS, encodeURIComponent(mergedClaims));
        };
        /**
         * add correlationId
         * @param correlationId
         */
        RequestParameterBuilder.prototype.addCorrelationId = function (correlationId) {
            this.parameters.set(AADServerParamKeys.CLIENT_REQUEST_ID, encodeURIComponent(correlationId));
        };
        /**
         * add library info query params
         * @param libraryInfo
         */
        RequestParameterBuilder.prototype.addLibraryInfo = function (libraryInfo) {
            // Telemetry Info
            this.parameters.set(AADServerParamKeys.X_CLIENT_SKU, libraryInfo.sku);
            this.parameters.set(AADServerParamKeys.X_CLIENT_VER, libraryInfo.version);
            this.parameters.set(AADServerParamKeys.X_CLIENT_OS, libraryInfo.os);
            this.parameters.set(AADServerParamKeys.X_CLIENT_CPU, libraryInfo.cpu);
        };
        /**
         * add prompt
         * @param prompt
         */
        RequestParameterBuilder.prototype.addPrompt = function (prompt) {
            RequestValidator.validatePrompt(prompt);
            this.parameters.set("" + AADServerParamKeys.PROMPT, encodeURIComponent(prompt));
        };
        /**
         * add state
         * @param state
         */
        RequestParameterBuilder.prototype.addState = function (state) {
            if (!StringUtils.isEmpty(state)) {
                this.parameters.set(AADServerParamKeys.STATE, encodeURIComponent(state));
            }
        };
        /**
         * add nonce
         * @param nonce
         */
        RequestParameterBuilder.prototype.addNonce = function (nonce) {
            this.parameters.set(AADServerParamKeys.NONCE, encodeURIComponent(nonce));
        };
        /**
         * add code_challenge and code_challenge_method
         * - throw if either of them are not passed
         * @param codeChallenge
         * @param codeChallengeMethod
         */
        RequestParameterBuilder.prototype.addCodeChallengeParams = function (codeChallenge, codeChallengeMethod) {
            RequestValidator.validateCodeChallengeParams(codeChallenge, codeChallengeMethod);
            if (codeChallenge && codeChallengeMethod) {
                this.parameters.set(AADServerParamKeys.CODE_CHALLENGE, encodeURIComponent(codeChallenge));
                this.parameters.set(AADServerParamKeys.CODE_CHALLENGE_METHOD, encodeURIComponent(codeChallengeMethod));
            }
            else {
                throw ClientConfigurationError.createInvalidCodeChallengeParamsError();
            }
        };
        /**
         * add the `authorization_code` passed by the user to exchange for a token
         * @param code
         */
        RequestParameterBuilder.prototype.addAuthorizationCode = function (code) {
            this.parameters.set(AADServerParamKeys.CODE, encodeURIComponent(code));
        };
        /**
         * add the `authorization_code` passed by the user to exchange for a token
         * @param code
         */
        RequestParameterBuilder.prototype.addDeviceCode = function (code) {
            this.parameters.set(AADServerParamKeys.DEVICE_CODE, encodeURIComponent(code));
        };
        /**
         * add the `refreshToken` passed by the user
         * @param refreshToken
         */
        RequestParameterBuilder.prototype.addRefreshToken = function (refreshToken) {
            this.parameters.set(AADServerParamKeys.REFRESH_TOKEN, encodeURIComponent(refreshToken));
        };
        /**
         * add the `code_verifier` passed by the user to exchange for a token
         * @param codeVerifier
         */
        RequestParameterBuilder.prototype.addCodeVerifier = function (codeVerifier) {
            this.parameters.set(AADServerParamKeys.CODE_VERIFIER, encodeURIComponent(codeVerifier));
        };
        /**
         * add client_secret
         * @param clientSecret
         */
        RequestParameterBuilder.prototype.addClientSecret = function (clientSecret) {
            this.parameters.set(AADServerParamKeys.CLIENT_SECRET, encodeURIComponent(clientSecret));
        };
        /**
         * add clientAssertion for confidential client flows
         * @param clientAssertion
         */
        RequestParameterBuilder.prototype.addClientAssertion = function (clientAssertion) {
            this.parameters.set(AADServerParamKeys.CLIENT_ASSERTION, encodeURIComponent(clientAssertion));
        };
        /**
         * add clientAssertionType for confidential client flows
         * @param clientAssertionType
         */
        RequestParameterBuilder.prototype.addClientAssertionType = function (clientAssertionType) {
            this.parameters.set(AADServerParamKeys.CLIENT_ASSERTION_TYPE, encodeURIComponent(clientAssertionType));
        };
        /**
         * add OBO assertion for confidential client flows
         * @param clientAssertion
         */
        RequestParameterBuilder.prototype.addOboAssertion = function (oboAssertion) {
            this.parameters.set(AADServerParamKeys.OBO_ASSERTION, encodeURIComponent(oboAssertion));
        };
        /**
         * add grant type
         * @param grantType
         */
        RequestParameterBuilder.prototype.addRequestTokenUse = function (tokenUse) {
            this.parameters.set(AADServerParamKeys.REQUESTED_TOKEN_USE, encodeURIComponent(tokenUse));
        };
        /**
         * add grant type
         * @param grantType
         */
        RequestParameterBuilder.prototype.addGrantType = function (grantType) {
            this.parameters.set(AADServerParamKeys.GRANT_TYPE, encodeURIComponent(grantType));
        };
        /**
         * add client info
         *
         */
        RequestParameterBuilder.prototype.addClientInfo = function () {
            this.parameters.set(CLIENT_INFO, "1");
        };
        /**
         * add extraQueryParams
         * @param eQparams
         */
        RequestParameterBuilder.prototype.addExtraQueryParameters = function (eQparams) {
            var _this = this;
            RequestValidator.sanitizeEQParams(eQparams, this.parameters);
            Object.keys(eQparams).forEach(function (key) {
                _this.parameters.set(key, eQparams[key]);
            });
        };
        RequestParameterBuilder.prototype.addClientCapabilitiesToClaims = function (claims, clientCapabilities) {
            var mergedClaims;
            // Parse provided claims into JSON object or initialize empty object
            if (!claims) {
                mergedClaims = {};
            }
            else {
                try {
                    mergedClaims = JSON.parse(claims);
                }
                catch (e) {
                    throw ClientConfigurationError.createInvalidClaimsRequestError();
                }
            }
            if (clientCapabilities && clientCapabilities.length > 0) {
                if (!mergedClaims.hasOwnProperty(ClaimsRequestKeys.ACCESS_TOKEN)) {
                    // Add access_token key to claims object
                    mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN] = {};
                }
                // Add xms_cc claim with provided clientCapabilities to access_token key
                mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN][ClaimsRequestKeys.XMS_CC] = {
                    values: clientCapabilities
                };
            }
            return JSON.stringify(mergedClaims);
        };
        /**
         * adds `username` for Password Grant flow
         * @param username
         */
        RequestParameterBuilder.prototype.addUsername = function (username) {
            this.parameters.set(PasswordGrantConstants.username, username);
        };
        /**
         * adds `password` for Password Grant flow
         * @param password
         */
        RequestParameterBuilder.prototype.addPassword = function (password) {
            this.parameters.set(PasswordGrantConstants.password, password);
        };
        /**
         * add pop_jwk to query params
         * @param cnfString
         */
        RequestParameterBuilder.prototype.addPopToken = function (cnfString) {
            if (!StringUtils.isEmpty(cnfString)) {
                this.parameters.set(AADServerParamKeys.TOKEN_TYPE, AuthenticationScheme.POP);
                this.parameters.set(AADServerParamKeys.REQ_CNF, encodeURIComponent(cnfString));
            }
        };
        /**
         * add server telemetry fields
         * @param serverTelemetryManager
         */
        RequestParameterBuilder.prototype.addServerTelemetry = function (serverTelemetryManager) {
            this.parameters.set(AADServerParamKeys.X_CLIENT_CURR_TELEM, serverTelemetryManager.generateCurrentRequestHeaderValue());
            this.parameters.set(AADServerParamKeys.X_CLIENT_LAST_TELEM, serverTelemetryManager.generateLastRequestHeaderValue());
        };
        /**
         * Adds parameter that indicates to the server that throttling is supported
         */
        RequestParameterBuilder.prototype.addThrottling = function () {
            this.parameters.set(AADServerParamKeys.X_MS_LIB_CAPABILITY, ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE);
        };
        /**
         * Utility to create a URL from the params map
         */
        RequestParameterBuilder.prototype.createQueryString = function () {
            var queryParameterArray = new Array();
            this.parameters.forEach(function (value, key) {
                queryParameterArray.push(key + "=" + value);
            });
            return queryParameterArray.join("&");
        };
        return RequestParameterBuilder;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * ID_TOKEN Cache
     *
     * Key:Value Schema:
     *
     * Key Example: uid.utid-login.microsoftonline.com-idtoken-clientId-contoso.com-
     *
     * Value Schema:
     * {
     *      homeAccountId: home account identifier for the auth scheme,
     *      environment: entity that issued the token, represented as a full host
     *      credentialType: Type of credential as a string, can be one of the following: RefreshToken, AccessToken, IdToken, Password, Cookie, Certificate, Other
     *      clientId: client ID of the application
     *      secret: Actual credential as a string
     *      realm: Full tenant or organizational identifier that the account belongs to
     * }
     */
    var IdTokenEntity = /** @class */ (function (_super) {
        __extends(IdTokenEntity, _super);
        function IdTokenEntity() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Create IdTokenEntity
         * @param homeAccountId
         * @param authenticationResult
         * @param clientId
         * @param authority
         */
        IdTokenEntity.createIdTokenEntity = function (homeAccountId, environment, idToken, clientId, tenantId, oboAssertion) {
            var idTokenEntity = new IdTokenEntity();
            idTokenEntity.credentialType = CredentialType.ID_TOKEN;
            idTokenEntity.homeAccountId = homeAccountId;
            idTokenEntity.environment = environment;
            idTokenEntity.clientId = clientId;
            idTokenEntity.secret = idToken;
            idTokenEntity.realm = tenantId;
            idTokenEntity.oboAssertion = oboAssertion;
            return idTokenEntity;
        };
        /**
         * Validates an entity: checks for all expected params
         * @param entity
         */
        IdTokenEntity.isIdTokenEntity = function (entity) {
            if (!entity) {
                return false;
            }
            return (entity.hasOwnProperty("homeAccountId") &&
                entity.hasOwnProperty("environment") &&
                entity.hasOwnProperty("credentialType") &&
                entity.hasOwnProperty("realm") &&
                entity.hasOwnProperty("clientId") &&
                entity.hasOwnProperty("secret") &&
                entity["credentialType"] === CredentialType.ID_TOKEN);
        };
        return IdTokenEntity;
    }(CredentialEntity));

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Utility class which exposes functions for managing date and time operations.
     */
    var TimeUtils = /** @class */ (function () {
        function TimeUtils() {
        }
        /**
         * return the current time in Unix time (seconds).
         */
        TimeUtils.nowSeconds = function () {
            // Date.getTime() returns in milliseconds.
            return Math.round(new Date().getTime() / 1000.0);
        };
        /**
         * check if a token is expired based on given UTC time in seconds.
         * @param expiresOn
         */
        TimeUtils.isTokenExpired = function (expiresOn, offset) {
            // check for access token expiry
            var expirationSec = Number(expiresOn) || 0;
            var offsetCurrentTimeSec = TimeUtils.nowSeconds() + offset;
            // If current time + offset is greater than token expiration time, then token is expired.
            return (offsetCurrentTimeSec > expirationSec);
        };
        /**
         * If the current time is earlier than the time that a token was cached at, we must discard the token
         * i.e. The system clock was turned back after acquiring the cached token
         * @param cachedAt
         * @param offset
         */
        TimeUtils.wasClockTurnedBack = function (cachedAt) {
            var cachedAtSec = Number(cachedAt);
            return cachedAtSec > TimeUtils.nowSeconds();
        };
        /**
         * Waits for t number of milliseconds
         * @param t number
         * @param value T
         */
        TimeUtils.delay = function (t, value) {
            return new Promise(function (resolve) { return setTimeout(function () { return resolve(value); }, t); });
        };
        return TimeUtils;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * ACCESS_TOKEN Credential Type
     *
     * Key:Value Schema:
     *
     * Key Example: uid.utid-login.microsoftonline.com-accesstoken-clientId-contoso.com-user.read
     *
     * Value Schema:
     * {
     *      homeAccountId: home account identifier for the auth scheme,
     *      environment: entity that issued the token, represented as a full host
     *      credentialType: Type of credential as a string, can be one of the following: RefreshToken, AccessToken, IdToken, Password, Cookie, Certificate, Other
     *      clientId: client ID of the application
     *      secret: Actual credential as a string
     *      familyId: Family ID identifier, usually only used for refresh tokens
     *      realm: Full tenant or organizational identifier that the account belongs to
     *      target: Permissions that are included in the token, or for refresh tokens, the resource identifier.
     *      cachedAt: Absolute device time when entry was created in the cache.
     *      expiresOn: Token expiry time, calculated based on current UTC time in seconds. Represented as a string.
     *      extendedExpiresOn: Additional extended expiry time until when token is valid in case of server-side outage. Represented as string in UTC seconds.
     *      keyId: used for POP and SSH tokenTypes
     *      tokenType: Type of the token issued. Usually "Bearer"
     * }
     */
    var AccessTokenEntity = /** @class */ (function (_super) {
        __extends(AccessTokenEntity, _super);
        function AccessTokenEntity() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Create AccessTokenEntity
         * @param homeAccountId
         * @param environment
         * @param accessToken
         * @param clientId
         * @param tenantId
         * @param scopes
         * @param expiresOn
         * @param extExpiresOn
         */
        AccessTokenEntity.createAccessTokenEntity = function (homeAccountId, environment, accessToken, clientId, tenantId, scopes, expiresOn, extExpiresOn, cryptoUtils, refreshOn, tokenType, oboAssertion) {
            var _a;
            var atEntity = new AccessTokenEntity();
            atEntity.homeAccountId = homeAccountId;
            atEntity.credentialType = CredentialType.ACCESS_TOKEN;
            atEntity.secret = accessToken;
            var currentTime = TimeUtils.nowSeconds();
            atEntity.cachedAt = currentTime.toString();
            /*
             * Token expiry time.
             * This value should be  calculated based on the current UTC time measured locally and the value  expires_in Represented as a string in JSON.
             */
            atEntity.expiresOn = expiresOn.toString();
            atEntity.extendedExpiresOn = extExpiresOn.toString();
            if (refreshOn) {
                atEntity.refreshOn = refreshOn.toString();
            }
            atEntity.environment = environment;
            atEntity.clientId = clientId;
            atEntity.realm = tenantId;
            atEntity.target = scopes;
            atEntity.oboAssertion = oboAssertion;
            atEntity.tokenType = StringUtils.isEmpty(tokenType) ? AuthenticationScheme.BEARER : tokenType;
            // Create Access Token With AuthScheme instead of regular access token
            if (atEntity.tokenType === AuthenticationScheme.POP) {
                atEntity.credentialType = CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
                // Make sure keyId is present and add it to credential
                var tokenClaims = AuthToken.extractTokenClaims(accessToken, cryptoUtils);
                if (!((_a = tokenClaims === null || tokenClaims === void 0 ? void 0 : tokenClaims.cnf) === null || _a === void 0 ? void 0 : _a.kid)) {
                    throw ClientAuthError.createTokenClaimsRequiredError();
                }
                atEntity.keyId = tokenClaims.cnf.kid;
            }
            return atEntity;
        };
        /**
         * Validates an entity: checks for all expected params
         * @param entity
         */
        AccessTokenEntity.isAccessTokenEntity = function (entity) {
            if (!entity) {
                return false;
            }
            return (entity.hasOwnProperty("homeAccountId") &&
                entity.hasOwnProperty("environment") &&
                entity.hasOwnProperty("credentialType") &&
                entity.hasOwnProperty("realm") &&
                entity.hasOwnProperty("clientId") &&
                entity.hasOwnProperty("secret") &&
                entity.hasOwnProperty("target") &&
                (entity["credentialType"] === CredentialType.ACCESS_TOKEN || entity["credentialType"] === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME));
        };
        return AccessTokenEntity;
    }(CredentialEntity));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * REFRESH_TOKEN Cache
     *
     * Key:Value Schema:
     *
     * Key Example: uid.utid-login.microsoftonline.com-refreshtoken-clientId--
     *
     * Value:
     * {
     *      homeAccountId: home account identifier for the auth scheme,
     *      environment: entity that issued the token, represented as a full host
     *      credentialType: Type of credential as a string, can be one of the following: RefreshToken, AccessToken, IdToken, Password, Cookie, Certificate, Other
     *      clientId: client ID of the application
     *      secret: Actual credential as a string
     *      familyId: Family ID identifier, '1' represents Microsoft Family
     *      realm: Full tenant or organizational identifier that the account belongs to
     *      target: Permissions that are included in the token, or for refresh tokens, the resource identifier.
     * }
     */
    var RefreshTokenEntity = /** @class */ (function (_super) {
        __extends(RefreshTokenEntity, _super);
        function RefreshTokenEntity() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Create RefreshTokenEntity
         * @param homeAccountId
         * @param authenticationResult
         * @param clientId
         * @param authority
         */
        RefreshTokenEntity.createRefreshTokenEntity = function (homeAccountId, environment, refreshToken, clientId, familyId, oboAssertion) {
            var rtEntity = new RefreshTokenEntity();
            rtEntity.clientId = clientId;
            rtEntity.credentialType = CredentialType.REFRESH_TOKEN;
            rtEntity.environment = environment;
            rtEntity.homeAccountId = homeAccountId;
            rtEntity.secret = refreshToken;
            rtEntity.oboAssertion = oboAssertion;
            if (familyId)
                rtEntity.familyId = familyId;
            return rtEntity;
        };
        /**
         * Validates an entity: checks for all expected params
         * @param entity
         */
        RefreshTokenEntity.isRefreshTokenEntity = function (entity) {
            if (!entity) {
                return false;
            }
            return (entity.hasOwnProperty("homeAccountId") &&
                entity.hasOwnProperty("environment") &&
                entity.hasOwnProperty("credentialType") &&
                entity.hasOwnProperty("clientId") &&
                entity.hasOwnProperty("secret") &&
                entity["credentialType"] === CredentialType.REFRESH_TOKEN);
        };
        return RefreshTokenEntity;
    }(CredentialEntity));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * InteractionRequiredAuthErrorMessage class containing string constants used by error codes and messages.
     */
    var InteractionRequiredAuthErrorMessage = [
        "interaction_required",
        "consent_required",
        "login_required"
    ];
    var InteractionRequiredAuthSubErrorMessage = [
        "message_only",
        "additional_action",
        "basic_action",
        "user_password_expired",
        "consent_required"
    ];
    /**
     * Error thrown when user interaction is required at the auth server.
     */
    var InteractionRequiredAuthError = /** @class */ (function (_super) {
        __extends(InteractionRequiredAuthError, _super);
        function InteractionRequiredAuthError(errorCode, errorMessage, subError) {
            var _this = _super.call(this, errorCode, errorMessage, subError) || this;
            _this.name = "InteractionRequiredAuthError";
            Object.setPrototypeOf(_this, InteractionRequiredAuthError.prototype);
            return _this;
        }
        InteractionRequiredAuthError.isInteractionRequiredError = function (errorCode, errorString, subError) {
            var isInteractionRequiredErrorCode = !!errorCode && InteractionRequiredAuthErrorMessage.indexOf(errorCode) > -1;
            var isInteractionRequiredSubError = !!subError && InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1;
            var isInteractionRequiredErrorDesc = !!errorString && InteractionRequiredAuthErrorMessage.some(function (irErrorCode) {
                return errorString.indexOf(irErrorCode) > -1;
            });
            return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc || isInteractionRequiredSubError;
        };
        return InteractionRequiredAuthError;
    }(ServerError));

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var CacheRecord = /** @class */ (function () {
        function CacheRecord(accountEntity, idTokenEntity, accessTokenEntity, refreshTokenEntity, appMetadataEntity) {
            this.account = accountEntity || null;
            this.idToken = idTokenEntity || null;
            this.accessToken = accessTokenEntity || null;
            this.refreshToken = refreshTokenEntity || null;
            this.appMetadata = appMetadataEntity || null;
        }
        return CacheRecord;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Class which provides helpers for OAuth 2.0 protocol specific values
     */
    var ProtocolUtils = /** @class */ (function () {
        function ProtocolUtils() {
        }
        /**
         * Appends user state with random guid, or returns random guid.
         * @param userState
         * @param randomGuid
         */
        ProtocolUtils.setRequestState = function (cryptoObj, userState, meta) {
            var libraryState = ProtocolUtils.generateLibraryState(cryptoObj, meta);
            return !StringUtils.isEmpty(userState) ? "" + libraryState + Constants.RESOURCE_DELIM + userState : libraryState;
        };
        /**
         * Generates the state value used by the common library.
         * @param randomGuid
         * @param cryptoObj
         */
        ProtocolUtils.generateLibraryState = function (cryptoObj, meta) {
            if (!cryptoObj) {
                throw ClientAuthError.createNoCryptoObjectError("generateLibraryState");
            }
            // Create a state object containing a unique id and the timestamp of the request creation
            var stateObj = {
                id: cryptoObj.createNewGuid()
            };
            if (meta) {
                stateObj.meta = meta;
            }
            var stateString = JSON.stringify(stateObj);
            return cryptoObj.base64Encode(stateString);
        };
        /**
         * Parses the state into the RequestStateObject, which contains the LibraryState info and the state passed by the user.
         * @param state
         * @param cryptoObj
         */
        ProtocolUtils.parseRequestState = function (cryptoObj, state) {
            if (!cryptoObj) {
                throw ClientAuthError.createNoCryptoObjectError("parseRequestState");
            }
            if (StringUtils.isEmpty(state)) {
                throw ClientAuthError.createInvalidStateError(state, "Null, undefined or empty state");
            }
            try {
                // Split the state between library state and user passed state and decode them separately
                var splitState = decodeURIComponent(state).split(Constants.RESOURCE_DELIM);
                var libraryState = splitState[0];
                var userState = splitState.length > 1 ? splitState.slice(1).join(Constants.RESOURCE_DELIM) : "";
                var libraryStateString = cryptoObj.base64Decode(libraryState);
                var libraryStateObj = JSON.parse(libraryStateString);
                return {
                    userRequestState: !StringUtils.isEmpty(userState) ? userState : "",
                    libraryState: libraryStateObj
                };
            }
            catch (e) {
                throw ClientAuthError.createInvalidStateError(state, e);
            }
        };
        return ProtocolUtils;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Url object class which can perform various transformations on url strings.
     */
    var UrlString = /** @class */ (function () {
        function UrlString(url) {
            this._urlString = url;
            if (StringUtils.isEmpty(this._urlString)) {
                // Throws error if url is empty
                throw ClientConfigurationError.createUrlEmptyError();
            }
            if (StringUtils.isEmpty(this.getHash())) {
                this._urlString = UrlString.canonicalizeUri(url);
            }
        }
        Object.defineProperty(UrlString.prototype, "urlString", {
            get: function () {
                return this._urlString;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Ensure urls are lower case and end with a / character.
         * @param url
         */
        UrlString.canonicalizeUri = function (url) {
            if (url) {
                var lowerCaseUrl = url.toLowerCase();
                if (StringUtils.endsWith(lowerCaseUrl, "?")) {
                    lowerCaseUrl = lowerCaseUrl.slice(0, -1);
                }
                else if (StringUtils.endsWith(lowerCaseUrl, "?/")) {
                    lowerCaseUrl = lowerCaseUrl.slice(0, -2);
                }
                if (!StringUtils.endsWith(lowerCaseUrl, "/")) {
                    lowerCaseUrl += "/";
                }
                return lowerCaseUrl;
            }
            return url;
        };
        /**
         * Throws if urlString passed is not a valid authority URI string.
         */
        UrlString.prototype.validateAsUri = function () {
            // Attempts to parse url for uri components
            var components;
            try {
                components = this.getUrlComponents();
            }
            catch (e) {
                throw ClientConfigurationError.createUrlParseError(e);
            }
            // Throw error if URI or path segments are not parseable.
            if (!components.HostNameAndPort || !components.PathSegments) {
                throw ClientConfigurationError.createUrlParseError("Given url string: " + this.urlString);
            }
            // Throw error if uri is insecure.
            if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
                throw ClientConfigurationError.createInsecureAuthorityUriError(this.urlString);
            }
        };
        /**
         * Function to remove query string params from url. Returns the new url.
         * @param url
         * @param name
         */
        UrlString.prototype.urlRemoveQueryStringParameter = function (name) {
            var regex = new RegExp("(\\&" + name + "=)[^\&]+");
            this._urlString = this.urlString.replace(regex, "");
            // name=value&
            regex = new RegExp("(" + name + "=)[^\&]+&");
            this._urlString = this.urlString.replace(regex, "");
            // name=value
            regex = new RegExp("(" + name + "=)[^\&]+");
            this._urlString = this.urlString.replace(regex, "");
            return this.urlString;
        };
        /**
         * Given a url and a query string return the url with provided query string appended
         * @param url
         * @param queryString
         */
        UrlString.appendQueryString = function (url, queryString) {
            if (StringUtils.isEmpty(queryString)) {
                return url;
            }
            return url.indexOf("?") < 0 ? url + "?" + queryString : url + "&" + queryString;
        };
        /**
         * Returns a url with the hash removed
         * @param url
         */
        UrlString.removeHashFromUrl = function (url) {
            return UrlString.canonicalizeUri(url.split("#")[0]);
        };
        /**
         * Given a url like https://a:b/common/d?e=f#g, and a tenantId, returns https://a:b/tenantId/d
         * @param href The url
         * @param tenantId The tenant id to replace
         */
        UrlString.prototype.replaceTenantPath = function (tenantId) {
            var urlObject = this.getUrlComponents();
            var pathArray = urlObject.PathSegments;
            if (tenantId && (pathArray.length !== 0 && (pathArray[0] === AADAuthorityConstants.COMMON || pathArray[0] === AADAuthorityConstants.ORGANIZATIONS))) {
                pathArray[0] = tenantId;
            }
            return UrlString.constructAuthorityUriFromObject(urlObject);
        };
        /**
         * Returns the anchor part(#) of the URL
         */
        UrlString.prototype.getHash = function () {
            return UrlString.parseHash(this.urlString);
        };
        /**
         * Parses out the components from a url string.
         * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
         */
        UrlString.prototype.getUrlComponents = function () {
            // https://gist.github.com/curtisz/11139b2cfcaef4a261e0
            var regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
            // If url string does not match regEx, we throw an error
            var match = this.urlString.match(regEx);
            if (!match) {
                throw ClientConfigurationError.createUrlParseError("Given url string: " + this.urlString);
            }
            // Url component object
            var urlComponents = {
                Protocol: match[1],
                HostNameAndPort: match[4],
                AbsolutePath: match[5],
                QueryString: match[7]
            };
            var pathSegments = urlComponents.AbsolutePath.split("/");
            pathSegments = pathSegments.filter(function (val) { return val && val.length > 0; }); // remove empty elements
            urlComponents.PathSegments = pathSegments;
            if (!StringUtils.isEmpty(urlComponents.QueryString) && urlComponents.QueryString.endsWith("/")) {
                urlComponents.QueryString = urlComponents.QueryString.substring(0, urlComponents.QueryString.length - 1);
            }
            return urlComponents;
        };
        UrlString.getDomainFromUrl = function (url) {
            var regEx = RegExp("^([^:/?#]+://)?([^/?#]*)");
            var match = url.match(regEx);
            if (!match) {
                throw ClientConfigurationError.createUrlParseError("Given url string: " + url);
            }
            return match[2];
        };
        UrlString.getAbsoluteUrl = function (relativeUrl, baseUrl) {
            if (relativeUrl[0] === Constants.FORWARD_SLASH) {
                var url = new UrlString(baseUrl);
                var baseComponents = url.getUrlComponents();
                return baseComponents.Protocol + "//" + baseComponents.HostNameAndPort + relativeUrl;
            }
            return relativeUrl;
        };
        /**
         * Parses hash string from given string. Returns empty string if no hash symbol is found.
         * @param hashString
         */
        UrlString.parseHash = function (hashString) {
            var hashIndex1 = hashString.indexOf("#");
            var hashIndex2 = hashString.indexOf("#/");
            if (hashIndex2 > -1) {
                return hashString.substring(hashIndex2 + 2);
            }
            else if (hashIndex1 > -1) {
                return hashString.substring(hashIndex1 + 1);
            }
            return "";
        };
        UrlString.constructAuthorityUriFromObject = function (urlObject) {
            return new UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + urlObject.PathSegments.join("/"));
        };
        /**
         * Returns URL hash as server auth code response object.
         */
        UrlString.getDeserializedHash = function (hash) {
            // Check if given hash is empty
            if (StringUtils.isEmpty(hash)) {
                return {};
            }
            // Strip the # symbol if present
            var parsedHash = UrlString.parseHash(hash);
            // If # symbol was not present, above will return empty string, so give original hash value
            var deserializedHash = StringUtils.queryStringToObject(StringUtils.isEmpty(parsedHash) ? hash : parsedHash);
            // Check if deserialization didn't work
            if (!deserializedHash) {
                throw ClientAuthError.createHashNotDeserializedError(JSON.stringify(deserializedHash));
            }
            return deserializedHash;
        };
        /**
         * Check if the hash of the URL string contains known properties
         */
        UrlString.hashContainsKnownProperties = function (hash) {
            if (StringUtils.isEmpty(hash)) {
                return false;
            }
            var parameters = UrlString.getDeserializedHash(hash);
            return !!(parameters.code ||
                parameters.error_description ||
                parameters.error ||
                parameters.state);
        };
        return UrlString;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var KeyLocation;
    (function (KeyLocation) {
        KeyLocation["SW"] = "sw";
        KeyLocation["UHW"] = "uhw";
    })(KeyLocation || (KeyLocation = {}));
    var PopTokenGenerator = /** @class */ (function () {
        function PopTokenGenerator(cryptoUtils) {
            this.cryptoUtils = cryptoUtils;
        }
        PopTokenGenerator.prototype.generateCnf = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var kidThumbprint, reqCnf;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.cryptoUtils.getPublicKeyThumbprint(request)];
                        case 1:
                            kidThumbprint = _a.sent();
                            reqCnf = {
                                kid: kidThumbprint,
                                xms_ksl: KeyLocation.SW
                            };
                            return [2 /*return*/, this.cryptoUtils.base64Encode(JSON.stringify(reqCnf))];
                    }
                });
            });
        };
        PopTokenGenerator.prototype.signPopToken = function (accessToken, request) {
            var _a;
            return __awaiter(this, void 0, void 0, function () {
                var tokenClaims, resourceRequestMethod, resourceRequestUri, shrClaims, resourceUrlString, resourceUrlComponents;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            tokenClaims = AuthToken.extractTokenClaims(accessToken, this.cryptoUtils);
                            resourceRequestMethod = request.resourceRequestMethod, resourceRequestUri = request.resourceRequestUri, shrClaims = request.shrClaims;
                            resourceUrlString = (resourceRequestUri) ? new UrlString(resourceRequestUri) : undefined;
                            resourceUrlComponents = resourceUrlString === null || resourceUrlString === void 0 ? void 0 : resourceUrlString.getUrlComponents();
                            if (!((_a = tokenClaims === null || tokenClaims === void 0 ? void 0 : tokenClaims.cnf) === null || _a === void 0 ? void 0 : _a.kid)) {
                                throw ClientAuthError.createTokenClaimsRequiredError();
                            }
                            return [4 /*yield*/, this.cryptoUtils.signJwt({
                                    at: accessToken,
                                    ts: TimeUtils.nowSeconds(),
                                    m: resourceRequestMethod === null || resourceRequestMethod === void 0 ? void 0 : resourceRequestMethod.toUpperCase(),
                                    u: resourceUrlComponents === null || resourceUrlComponents === void 0 ? void 0 : resourceUrlComponents.HostNameAndPort,
                                    nonce: this.cryptoUtils.createNewGuid(),
                                    p: resourceUrlComponents === null || resourceUrlComponents === void 0 ? void 0 : resourceUrlComponents.AbsolutePath,
                                    q: (resourceUrlComponents === null || resourceUrlComponents === void 0 ? void 0 : resourceUrlComponents.QueryString) ? [[], resourceUrlComponents.QueryString] : undefined,
                                    client_claims: shrClaims || undefined
                                }, tokenClaims.cnf.kid)];
                        case 1: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        return PopTokenGenerator;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * APP_METADATA Cache
     *
     * Key:Value Schema:
     *
     * Key: appmetadata-<environment>-<client_id>
     *
     * Value:
     * {
     *      clientId: client ID of the application
     *      environment: entity that issued the token, represented as a full host
     *      familyId: Family ID identifier, '1' represents Microsoft Family
     * }
     */
    var AppMetadataEntity = /** @class */ (function () {
        function AppMetadataEntity() {
        }
        /**
         * Generate AppMetadata Cache Key as per the schema: appmetadata-<environment>-<client_id>
         */
        AppMetadataEntity.prototype.generateAppMetadataKey = function () {
            return AppMetadataEntity.generateAppMetadataCacheKey(this.environment, this.clientId);
        };
        /**
         * Generate AppMetadata Cache Key
         */
        AppMetadataEntity.generateAppMetadataCacheKey = function (environment, clientId) {
            var appMetaDataKeyArray = [
                APP_METADATA,
                environment,
                clientId,
            ];
            return appMetaDataKeyArray.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
        };
        /**
         * Creates AppMetadataEntity
         * @param clientId
         * @param environment
         * @param familyId
         */
        AppMetadataEntity.createAppMetadataEntity = function (clientId, environment, familyId) {
            var appMetadata = new AppMetadataEntity();
            appMetadata.clientId = clientId;
            appMetadata.environment = environment;
            if (familyId) {
                appMetadata.familyId = familyId;
            }
            return appMetadata;
        };
        /**
         * Validates an entity: checks for all expected params
         * @param entity
         */
        AppMetadataEntity.isAppMetadataEntity = function (key, entity) {
            if (!entity) {
                return false;
            }
            return (key.indexOf(APP_METADATA) === 0 &&
                entity.hasOwnProperty("clientId") &&
                entity.hasOwnProperty("environment"));
        };
        return AppMetadataEntity;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * This class instance helps track the memory changes facilitating
     * decisions to read from and write to the persistent cache
     */ var TokenCacheContext = /** @class */ (function () {
        function TokenCacheContext(tokenCache, hasChanged) {
            this.cache = tokenCache;
            this.hasChanged = hasChanged;
        }
        Object.defineProperty(TokenCacheContext.prototype, "cacheHasChanged", {
            /**
             * boolean which indicates the changes in cache
             */
            get: function () {
                return this.hasChanged;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(TokenCacheContext.prototype, "tokenCache", {
            /**
             * function to retrieve the token cache
             */
            get: function () {
                return this.cache;
            },
            enumerable: false,
            configurable: true
        });
        return TokenCacheContext;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Class that handles response parsing.
     */
    var ResponseHandler = /** @class */ (function () {
        function ResponseHandler(clientId, cacheStorage, cryptoObj, logger, serializableCache, persistencePlugin) {
            this.clientId = clientId;
            this.cacheStorage = cacheStorage;
            this.cryptoObj = cryptoObj;
            this.logger = logger;
            this.serializableCache = serializableCache;
            this.persistencePlugin = persistencePlugin;
        }
        /**
         * Function which validates server authorization code response.
         * @param serverResponseHash
         * @param cachedState
         * @param cryptoObj
         */
        ResponseHandler.prototype.validateServerAuthorizationCodeResponse = function (serverResponseHash, cachedState, cryptoObj) {
            if (!serverResponseHash.state || !cachedState) {
                throw !serverResponseHash.state ? ClientAuthError.createStateNotFoundError("Server State") : ClientAuthError.createStateNotFoundError("Cached State");
            }
            if (decodeURIComponent(serverResponseHash.state) !== decodeURIComponent(cachedState)) {
                throw ClientAuthError.createStateMismatchError();
            }
            // Check for error
            if (serverResponseHash.error || serverResponseHash.error_description || serverResponseHash.suberror) {
                if (InteractionRequiredAuthError.isInteractionRequiredError(serverResponseHash.error, serverResponseHash.error_description, serverResponseHash.suberror)) {
                    throw new InteractionRequiredAuthError(serverResponseHash.error || Constants.EMPTY_STRING, serverResponseHash.error_description, serverResponseHash.suberror);
                }
                throw new ServerError(serverResponseHash.error || Constants.EMPTY_STRING, serverResponseHash.error_description, serverResponseHash.suberror);
            }
            if (serverResponseHash.client_info) {
                buildClientInfo(serverResponseHash.client_info, cryptoObj);
            }
        };
        /**
         * Function which validates server authorization token response.
         * @param serverResponse
         */
        ResponseHandler.prototype.validateTokenResponse = function (serverResponse) {
            // Check for error
            if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
                if (InteractionRequiredAuthError.isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
                    throw new InteractionRequiredAuthError(serverResponse.error, serverResponse.error_description, serverResponse.suberror);
                }
                var errString = serverResponse.error_codes + " - [" + serverResponse.timestamp + "]: " + serverResponse.error_description + " - Correlation ID: " + serverResponse.correlation_id + " - Trace ID: " + serverResponse.trace_id;
                throw new ServerError(serverResponse.error, errString, serverResponse.suberror);
            }
        };
        /**
         * Returns a constructed token response based on given string. Also manages the cache updates and cleanups.
         * @param serverTokenResponse
         * @param authority
         */
        ResponseHandler.prototype.handleServerTokenResponse = function (serverTokenResponse, authority, reqTimestamp, request, authCodePayload, oboAssertion, handlingRefreshTokenResponse) {
            return __awaiter(this, void 0, void 0, function () {
                var idTokenObj, requestStateObj, cacheRecord, cacheContext, key, account;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (serverTokenResponse.id_token) {
                                idTokenObj = new AuthToken(serverTokenResponse.id_token || Constants.EMPTY_STRING, this.cryptoObj);
                                // token nonce check (TODO: Add a warning if no nonce is given?)
                                if (authCodePayload && !StringUtils.isEmpty(authCodePayload.nonce)) {
                                    if (idTokenObj.claims.nonce !== authCodePayload.nonce) {
                                        throw ClientAuthError.createNonceMismatchError();
                                    }
                                }
                            }
                            // generate homeAccountId
                            this.homeAccountIdentifier = AccountEntity.generateHomeAccountId(serverTokenResponse.client_info || Constants.EMPTY_STRING, authority.authorityType, this.logger, this.cryptoObj, idTokenObj);
                            if (!!authCodePayload && !!authCodePayload.state) {
                                requestStateObj = ProtocolUtils.parseRequestState(this.cryptoObj, authCodePayload.state);
                            }
                            cacheRecord = this.generateCacheRecord(serverTokenResponse, authority, reqTimestamp, idTokenObj, request.scopes, oboAssertion, authCodePayload);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, , 4, 7]);
                            if (!(this.persistencePlugin && this.serializableCache)) return [3 /*break*/, 3];
                            this.logger.verbose("Persistence enabled, calling beforeCacheAccess");
                            cacheContext = new TokenCacheContext(this.serializableCache, true);
                            return [4 /*yield*/, this.persistencePlugin.beforeCacheAccess(cacheContext)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            /*
                             * When saving a refreshed tokens to the cache, it is expected that the account that was used is present in the cache.
                             * If not present, we should return null, as it's the case that another application called removeAccount in between
                             * the calls to getAllAccounts and acquireTokenSilent. We should not overwrite that removal.
                             */
                            if (handlingRefreshTokenResponse && cacheRecord.account) {
                                key = cacheRecord.account.generateAccountKey();
                                account = this.cacheStorage.getAccount(key);
                                if (!account) {
                                    this.logger.warning("Account used to refresh tokens not in persistence, refreshed tokens will not be stored in the cache");
                                    return [2 /*return*/, ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, idTokenObj, requestStateObj)];
                                }
                            }
                            this.cacheStorage.saveCacheRecord(cacheRecord);
                            return [3 /*break*/, 7];
                        case 4:
                            if (!(this.persistencePlugin && this.serializableCache && cacheContext)) return [3 /*break*/, 6];
                            this.logger.verbose("Persistence enabled, calling afterCacheAccess");
                            return [4 /*yield*/, this.persistencePlugin.afterCacheAccess(cacheContext)];
                        case 5:
                            _a.sent();
                            _a.label = 6;
                        case 6: return [7 /*endfinally*/];
                        case 7: return [2 /*return*/, ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, idTokenObj, requestStateObj)];
                    }
                });
            });
        };
        /**
         * Generates CacheRecord
         * @param serverTokenResponse
         * @param idTokenObj
         * @param authority
         */
        ResponseHandler.prototype.generateCacheRecord = function (serverTokenResponse, authority, reqTimestamp, idTokenObj, requestScopes, oboAssertion, authCodePayload) {
            var env = authority.getPreferredCache();
            if (StringUtils.isEmpty(env)) {
                throw ClientAuthError.createInvalidCacheEnvironmentError();
            }
            // IdToken: non AAD scenarios can have empty realm
            var cachedIdToken;
            var cachedAccount;
            if (!StringUtils.isEmpty(serverTokenResponse.id_token) && !!idTokenObj) {
                cachedIdToken = IdTokenEntity.createIdTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.id_token || Constants.EMPTY_STRING, this.clientId, idTokenObj.claims.tid || Constants.EMPTY_STRING, oboAssertion);
                cachedAccount = this.generateAccountEntity(serverTokenResponse, idTokenObj, authority, oboAssertion, authCodePayload);
            }
            // AccessToken
            var cachedAccessToken = null;
            if (!StringUtils.isEmpty(serverTokenResponse.access_token)) {
                // If scopes not returned in server response, use request scopes
                var responseScopes = serverTokenResponse.scope ? ScopeSet.fromString(serverTokenResponse.scope) : new ScopeSet(requestScopes || []);
                /*
                 * Use timestamp calculated before request
                 * Server may return timestamps as strings, parse to numbers if so.
                 */
                var expiresIn = (typeof serverTokenResponse.expires_in === "string" ? parseInt(serverTokenResponse.expires_in, 10) : serverTokenResponse.expires_in) || 0;
                var extExpiresIn = (typeof serverTokenResponse.ext_expires_in === "string" ? parseInt(serverTokenResponse.ext_expires_in, 10) : serverTokenResponse.ext_expires_in) || 0;
                var refreshIn = (typeof serverTokenResponse.refresh_in === "string" ? parseInt(serverTokenResponse.refresh_in, 10) : serverTokenResponse.refresh_in) || undefined;
                var tokenExpirationSeconds = reqTimestamp + expiresIn;
                var extendedTokenExpirationSeconds = tokenExpirationSeconds + extExpiresIn;
                var refreshOnSeconds = refreshIn && refreshIn > 0 ? reqTimestamp + refreshIn : undefined;
                // non AAD scenarios can have empty realm
                cachedAccessToken = AccessTokenEntity.createAccessTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.access_token || Constants.EMPTY_STRING, this.clientId, idTokenObj ? idTokenObj.claims.tid || Constants.EMPTY_STRING : authority.tenant, responseScopes.printScopes(), tokenExpirationSeconds, extendedTokenExpirationSeconds, this.cryptoObj, refreshOnSeconds, serverTokenResponse.token_type, oboAssertion);
            }
            // refreshToken
            var cachedRefreshToken = null;
            if (!StringUtils.isEmpty(serverTokenResponse.refresh_token)) {
                cachedRefreshToken = RefreshTokenEntity.createRefreshTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.refresh_token || Constants.EMPTY_STRING, this.clientId, serverTokenResponse.foci, oboAssertion);
            }
            // appMetadata
            var cachedAppMetadata = null;
            if (!StringUtils.isEmpty(serverTokenResponse.foci)) {
                cachedAppMetadata = AppMetadataEntity.createAppMetadataEntity(this.clientId, env, serverTokenResponse.foci);
            }
            return new CacheRecord(cachedAccount, cachedIdToken, cachedAccessToken, cachedRefreshToken, cachedAppMetadata);
        };
        /**
         * Generate Account
         * @param serverTokenResponse
         * @param idToken
         * @param authority
         */
        ResponseHandler.prototype.generateAccountEntity = function (serverTokenResponse, idToken, authority, oboAssertion, authCodePayload) {
            var authorityType = authority.authorityType;
            var cloudGraphHostName = authCodePayload ? authCodePayload.cloud_graph_host_name : "";
            var msGraphhost = authCodePayload ? authCodePayload.msgraph_host : "";
            // ADFS does not require client_info in the response
            if (authorityType === AuthorityType.Adfs) {
                this.logger.verbose("Authority type is ADFS, creating ADFS account");
                return AccountEntity.createGenericAccount(authority, this.homeAccountIdentifier, idToken, oboAssertion, cloudGraphHostName, msGraphhost);
            }
            // This fallback applies to B2C as well as they fall under an AAD account type.
            if (StringUtils.isEmpty(serverTokenResponse.client_info) && authority.protocolMode === "AAD") {
                throw ClientAuthError.createClientInfoEmptyError();
            }
            return serverTokenResponse.client_info ?
                AccountEntity.createAccount(serverTokenResponse.client_info, this.homeAccountIdentifier, authority, idToken, oboAssertion, cloudGraphHostName, msGraphhost) :
                AccountEntity.createGenericAccount(authority, this.homeAccountIdentifier, idToken, oboAssertion, cloudGraphHostName, msGraphhost);
        };
        /**
         * Creates an @AuthenticationResult from @CacheRecord , @IdToken , and a boolean that states whether or not the result is from cache.
         *
         * Optionally takes a state string that is set as-is in the response.
         *
         * @param cacheRecord
         * @param idTokenObj
         * @param fromTokenCache
         * @param stateString
         */
        ResponseHandler.generateAuthenticationResult = function (cryptoObj, authority, cacheRecord, fromTokenCache, request, idTokenObj, requestState) {
            var _a, _b, _c;
            return __awaiter(this, void 0, void 0, function () {
                var accessToken, responseScopes, expiresOn, extExpiresOn, familyId, popTokenGenerator, uid, tid;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            accessToken = "";
                            responseScopes = [];
                            expiresOn = null;
                            familyId = Constants.EMPTY_STRING;
                            if (!cacheRecord.accessToken) return [3 /*break*/, 4];
                            if (!(cacheRecord.accessToken.tokenType === AuthenticationScheme.POP)) return [3 /*break*/, 2];
                            popTokenGenerator = new PopTokenGenerator(cryptoObj);
                            return [4 /*yield*/, popTokenGenerator.signPopToken(cacheRecord.accessToken.secret, request)];
                        case 1:
                            accessToken = _d.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            accessToken = cacheRecord.accessToken.secret;
                            _d.label = 3;
                        case 3:
                            responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target).asArray();
                            expiresOn = new Date(Number(cacheRecord.accessToken.expiresOn) * 1000);
                            extExpiresOn = new Date(Number(cacheRecord.accessToken.extendedExpiresOn) * 1000);
                            _d.label = 4;
                        case 4:
                            if (cacheRecord.appMetadata) {
                                familyId = cacheRecord.appMetadata.familyId === THE_FAMILY_ID ? THE_FAMILY_ID : Constants.EMPTY_STRING;
                            }
                            uid = (idTokenObj === null || idTokenObj === void 0 ? void 0 : idTokenObj.claims.oid) || (idTokenObj === null || idTokenObj === void 0 ? void 0 : idTokenObj.claims.sub) || Constants.EMPTY_STRING;
                            tid = (idTokenObj === null || idTokenObj === void 0 ? void 0 : idTokenObj.claims.tid) || Constants.EMPTY_STRING;
                            return [2 /*return*/, {
                                    authority: authority.canonicalAuthority,
                                    uniqueId: uid,
                                    tenantId: tid,
                                    scopes: responseScopes,
                                    account: cacheRecord.account ? cacheRecord.account.getAccountInfo() : null,
                                    idToken: idTokenObj ? idTokenObj.rawToken : Constants.EMPTY_STRING,
                                    idTokenClaims: idTokenObj ? idTokenObj.claims : {},
                                    accessToken: accessToken,
                                    fromCache: fromTokenCache,
                                    expiresOn: expiresOn,
                                    extExpiresOn: extExpiresOn,
                                    familyId: familyId,
                                    tokenType: ((_a = cacheRecord.accessToken) === null || _a === void 0 ? void 0 : _a.tokenType) || Constants.EMPTY_STRING,
                                    state: requestState ? requestState.userRequestState : Constants.EMPTY_STRING,
                                    cloudGraphHostName: ((_b = cacheRecord.account) === null || _b === void 0 ? void 0 : _b.cloudGraphHostName) || Constants.EMPTY_STRING,
                                    msGraphHost: ((_c = cacheRecord.account) === null || _c === void 0 ? void 0 : _c.msGraphHost) || Constants.EMPTY_STRING
                                }];
                    }
                });
            });
        };
        return ResponseHandler;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Oauth2.0 Authorization Code client
     */
    var AuthorizationCodeClient = /** @class */ (function (_super) {
        __extends(AuthorizationCodeClient, _super);
        function AuthorizationCodeClient(configuration) {
            return _super.call(this, configuration) || this;
        }
        /**
         * Creates the URL of the authorization request letting the user input credentials and consent to the
         * application. The URL target the /authorize endpoint of the authority configured in the
         * application object.
         *
         * Once the user inputs their credentials and consents, the authority will send a response to the redirect URI
         * sent in the request and should contain an authorization code, which can then be used to acquire tokens via
         * acquireToken(AuthorizationCodeRequest)
         * @param request
         */
        AuthorizationCodeClient.prototype.getAuthCodeUrl = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var queryString;
                return __generator(this, function (_a) {
                    queryString = this.createAuthCodeUrlQueryString(request);
                    return [2 /*return*/, UrlString.appendQueryString(this.authority.authorizationEndpoint, queryString)];
                });
            });
        };
        /**
         * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
         * authorization_code_grant
         * @param request
         */
        AuthorizationCodeClient.prototype.acquireToken = function (request, authCodePayload) {
            return __awaiter(this, void 0, void 0, function () {
                var reqTimestamp, response, responseHandler;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.info("in acquireToken call");
                            if (!request || StringUtils.isEmpty(request.code)) {
                                throw ClientAuthError.createTokenRequestCannotBeMadeError();
                            }
                            reqTimestamp = TimeUtils.nowSeconds();
                            return [4 /*yield*/, this.executeTokenRequest(this.authority, request)];
                        case 1:
                            response = _a.sent();
                            responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin);
                            // Validate response. This function throws a server error if an error is returned by the server.
                            responseHandler.validateTokenResponse(response.body);
                            return [4 /*yield*/, responseHandler.handleServerTokenResponse(response.body, this.authority, reqTimestamp, request, authCodePayload)];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Handles the hash fragment response from public client code request. Returns a code response used by
         * the client to exchange for a token in acquireToken.
         * @param hashFragment
         */
        AuthorizationCodeClient.prototype.handleFragmentResponse = function (hashFragment, cachedState) {
            // Handle responses.
            var responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, null, null);
            // Deserialize hash fragment response parameters.
            var hashUrlString = new UrlString(hashFragment);
            // Deserialize hash fragment response parameters.
            var serverParams = UrlString.getDeserializedHash(hashUrlString.getHash());
            // Get code response
            responseHandler.validateServerAuthorizationCodeResponse(serverParams, cachedState, this.cryptoUtils);
            // throw when there is no auth code in the response
            if (!serverParams.code) {
                throw ClientAuthError.createNoAuthCodeInServerResponseError();
            }
            return __assign(__assign({}, serverParams), { 
                // Code param is optional in ServerAuthorizationCodeResponse but required in AuthorizationCodePaylod
                code: serverParams.code });
        };
        /**
         * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
         * Default behaviour is to redirect the user to `window.location.href`.
         * @param authorityUri
         */
        AuthorizationCodeClient.prototype.getLogoutUri = function (logoutRequest) {
            // Throw error if logoutRequest is null/undefined
            if (!logoutRequest) {
                throw ClientConfigurationError.createEmptyLogoutRequestError();
            }
            if (logoutRequest.account) {
                // Clear given account.
                this.cacheManager.removeAccount(AccountEntity.generateAccountCacheKey(logoutRequest.account));
            }
            else {
                // Clear all accounts and tokens
                this.cacheManager.clear();
            }
            var queryString = this.createLogoutUrlQueryString(logoutRequest);
            // Construct logout URI.
            return StringUtils.isEmpty(queryString) ? this.authority.endSessionEndpoint : this.authority.endSessionEndpoint + "?" + queryString;
        };
        /**
         * Executes POST request to token endpoint
         * @param authority
         * @param request
         */
        AuthorizationCodeClient.prototype.executeTokenRequest = function (authority, request) {
            return __awaiter(this, void 0, void 0, function () {
                var thumbprint, requestBody, queryParameters, ccsCredential, clientInfo, headers, endpoint;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            thumbprint = {
                                clientId: this.config.authOptions.clientId,
                                authority: authority.canonicalAuthority,
                                scopes: request.scopes
                            };
                            return [4 /*yield*/, this.createTokenRequestBody(request)];
                        case 1:
                            requestBody = _a.sent();
                            queryParameters = this.createTokenQueryParameters(request);
                            ccsCredential = undefined;
                            if (request.clientInfo) {
                                try {
                                    clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils);
                                    ccsCredential = {
                                        credential: "" + clientInfo.uid + Separators.CLIENT_INFO_SEPARATOR + clientInfo.utid,
                                        type: CcsCredentialType.HOME_ACCOUNT_ID
                                    };
                                }
                                catch (e) {
                                    this.logger.verbose("Could not parse client info for CCS Header: " + e);
                                }
                            }
                            headers = this.createTokenRequestHeaders(ccsCredential || request.ccsCredential);
                            endpoint = StringUtils.isEmpty(queryParameters) ? authority.tokenEndpoint : authority.tokenEndpoint + "?" + queryParameters;
                            return [2 /*return*/, this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint)];
                    }
                });
            });
        };
        /**
         * Creates query string for the /token request
         * @param request
         */
        AuthorizationCodeClient.prototype.createTokenQueryParameters = function (request) {
            var parameterBuilder = new RequestParameterBuilder();
            if (request.tokenQueryParameters) {
                parameterBuilder.addExtraQueryParameters(request.tokenQueryParameters);
            }
            return parameterBuilder.createQueryString();
        };
        /**
         * Generates a map for all the params to be sent to the service
         * @param request
         */
        AuthorizationCodeClient.prototype.createTokenRequestBody = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var parameterBuilder, clientAssertion, popTokenGenerator, cnfString, correlationId, ccsCred, clientInfo, clientInfo;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            parameterBuilder = new RequestParameterBuilder();
                            parameterBuilder.addClientId(this.config.authOptions.clientId);
                            // validate the redirectUri (to be a non null value)
                            parameterBuilder.addRedirectUri(request.redirectUri);
                            // Add scope array, parameter builder will add default scopes and dedupe
                            parameterBuilder.addScopes(request.scopes);
                            // add code: user set, not validated
                            parameterBuilder.addAuthorizationCode(request.code);
                            // Add library metadata
                            parameterBuilder.addLibraryInfo(this.config.libraryInfo);
                            parameterBuilder.addThrottling();
                            if (this.serverTelemetryManager) {
                                parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
                            }
                            // add code_verifier if passed
                            if (request.codeVerifier) {
                                parameterBuilder.addCodeVerifier(request.codeVerifier);
                            }
                            if (this.config.clientCredentials.clientSecret) {
                                parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret);
                            }
                            if (this.config.clientCredentials.clientAssertion) {
                                clientAssertion = this.config.clientCredentials.clientAssertion;
                                parameterBuilder.addClientAssertion(clientAssertion.assertion);
                                parameterBuilder.addClientAssertionType(clientAssertion.assertionType);
                            }
                            parameterBuilder.addGrantType(GrantType.AUTHORIZATION_CODE_GRANT);
                            parameterBuilder.addClientInfo();
                            if (!(request.authenticationScheme === AuthenticationScheme.POP)) return [3 /*break*/, 2];
                            popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
                            return [4 /*yield*/, popTokenGenerator.generateCnf(request)];
                        case 1:
                            cnfString = _a.sent();
                            parameterBuilder.addPopToken(cnfString);
                            _a.label = 2;
                        case 2:
                            correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
                            parameterBuilder.addCorrelationId(correlationId);
                            if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
                                parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
                            }
                            ccsCred = undefined;
                            if (request.clientInfo) {
                                try {
                                    clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils);
                                    ccsCred = {
                                        credential: "" + clientInfo.uid + Separators.CLIENT_INFO_SEPARATOR + clientInfo.utid,
                                        type: CcsCredentialType.HOME_ACCOUNT_ID
                                    };
                                }
                                catch (e) {
                                    this.logger.verbose("Could not parse client info for CCS Header: " + e);
                                }
                            }
                            else {
                                ccsCred = request.ccsCredential;
                            }
                            // Adds these as parameters in the request instead of headers to prevent CORS preflight request
                            if (this.config.systemOptions.preventCorsPreflight && ccsCred) {
                                switch (ccsCred.type) {
                                    case CcsCredentialType.HOME_ACCOUNT_ID:
                                        try {
                                            clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
                                            parameterBuilder.addCcsOid(clientInfo);
                                        }
                                        catch (e) {
                                            this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                                        }
                                        break;
                                    case CcsCredentialType.UPN:
                                        parameterBuilder.addCcsUpn(ccsCred.credential);
                                        break;
                                }
                            }
                            return [2 /*return*/, parameterBuilder.createQueryString()];
                    }
                });
            });
        };
        /**
         * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
         * @param request
         */
        AuthorizationCodeClient.prototype.createAuthCodeUrlQueryString = function (request) {
            var parameterBuilder = new RequestParameterBuilder();
            parameterBuilder.addClientId(this.config.authOptions.clientId);
            var requestScopes = __spreadArrays(request.scopes || [], request.extraScopesToConsent || []);
            parameterBuilder.addScopes(requestScopes);
            // validate the redirectUri (to be a non null value)
            parameterBuilder.addRedirectUri(request.redirectUri);
            // generate the correlationId if not set by the user and add
            var correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
            parameterBuilder.addCorrelationId(correlationId);
            // add response_mode. If not passed in it defaults to query.
            parameterBuilder.addResponseMode(request.responseMode);
            // add response_type = code
            parameterBuilder.addResponseTypeCode();
            // add library info parameters
            parameterBuilder.addLibraryInfo(this.config.libraryInfo);
            // add client_info=1
            parameterBuilder.addClientInfo();
            if (request.codeChallenge && request.codeChallengeMethod) {
                parameterBuilder.addCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod);
            }
            if (request.prompt) {
                parameterBuilder.addPrompt(request.prompt);
            }
            if (request.domainHint) {
                parameterBuilder.addDomainHint(request.domainHint);
            }
            // Add sid or loginHint with preference for sid -> loginHint -> username of AccountInfo object
            if (request.prompt !== PromptValue.SELECT_ACCOUNT) {
                // AAD will throw if prompt=select_account is passed with an account hint
                if (request.sid && request.prompt === PromptValue.NONE) {
                    // SessionID is only used in silent calls
                    this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from request");
                    parameterBuilder.addSid(request.sid);
                }
                else if (request.account) {
                    var accountSid = this.extractAccountSid(request.account);
                    // If account and loginHint are provided, we will check account first for sid before adding loginHint
                    if (accountSid && request.prompt === PromptValue.NONE) {
                        // SessionId is only used in silent calls
                        this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from account");
                        parameterBuilder.addSid(accountSid);
                        try {
                            var clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
                            parameterBuilder.addCcsOid(clientInfo);
                        }
                        catch (e) {
                            this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                        }
                    }
                    else if (request.loginHint) {
                        this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from request");
                        parameterBuilder.addLoginHint(request.loginHint);
                        parameterBuilder.addCcsUpn(request.loginHint);
                    }
                    else if (request.account.username) {
                        // Fallback to account username if provided
                        this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from account");
                        parameterBuilder.addLoginHint(request.account.username);
                        try {
                            var clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
                            parameterBuilder.addCcsOid(clientInfo);
                        }
                        catch (e) {
                            this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                        }
                    }
                }
                else if (request.loginHint) {
                    this.logger.verbose("createAuthCodeUrlQueryString: No account, adding login_hint from request");
                    parameterBuilder.addLoginHint(request.loginHint);
                    parameterBuilder.addCcsUpn(request.loginHint);
                }
            }
            else {
                this.logger.verbose("createAuthCodeUrlQueryString: Prompt is select_account, ignoring account hints");
            }
            if (request.nonce) {
                parameterBuilder.addNonce(request.nonce);
            }
            if (request.state) {
                parameterBuilder.addState(request.state);
            }
            if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
                parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
            }
            if (request.extraQueryParameters) {
                parameterBuilder.addExtraQueryParameters(request.extraQueryParameters);
            }
            return parameterBuilder.createQueryString();
        };
        /**
         * This API validates the `EndSessionRequest` and creates a URL
         * @param request
         */
        AuthorizationCodeClient.prototype.createLogoutUrlQueryString = function (request) {
            var parameterBuilder = new RequestParameterBuilder();
            if (request.postLogoutRedirectUri) {
                parameterBuilder.addPostLogoutRedirectUri(request.postLogoutRedirectUri);
            }
            if (request.correlationId) {
                parameterBuilder.addCorrelationId(request.correlationId);
            }
            if (request.idTokenHint) {
                parameterBuilder.addIdTokenHint(request.idTokenHint);
            }
            return parameterBuilder.createQueryString();
        };
        /**
         * Helper to get sid from account. Returns null if idTokenClaims are not present or sid is not present.
         * @param account
         */
        AuthorizationCodeClient.prototype.extractAccountSid = function (account) {
            if (account.idTokenClaims) {
                var tokenClaims = account.idTokenClaims;
                return tokenClaims.sid || null;
            }
            return null;
        };
        return AuthorizationCodeClient;
    }(BaseClient));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * OAuth2.0 refresh token client
     */
    var RefreshTokenClient = /** @class */ (function (_super) {
        __extends(RefreshTokenClient, _super);
        function RefreshTokenClient(configuration) {
            return _super.call(this, configuration) || this;
        }
        RefreshTokenClient.prototype.acquireToken = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var reqTimestamp, response, responseHandler;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            reqTimestamp = TimeUtils.nowSeconds();
                            return [4 /*yield*/, this.executeTokenRequest(request, this.authority)];
                        case 1:
                            response = _a.sent();
                            responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin);
                            responseHandler.validateTokenResponse(response.body);
                            return [2 /*return*/, responseHandler.handleServerTokenResponse(response.body, this.authority, reqTimestamp, request, undefined, undefined, true)];
                    }
                });
            });
        };
        /**
         * Gets cached refresh token and attaches to request, then calls acquireToken API
         * @param request
         */
        RefreshTokenClient.prototype.acquireTokenByRefreshToken = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var isFOCI, noFamilyRTInCache, clientMismatchErrorWithFamilyRT;
                return __generator(this, function (_a) {
                    // Cannot renew token if no request object is given.
                    if (!request) {
                        throw ClientConfigurationError.createEmptyTokenRequestError();
                    }
                    // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
                    if (!request.account) {
                        throw ClientAuthError.createNoAccountInSilentRequestError();
                    }
                    isFOCI = this.cacheManager.isAppMetadataFOCI(request.account.environment, this.config.authOptions.clientId);
                    // if the app is part of the family, retrive a Family refresh token if present and make a refreshTokenRequest
                    if (isFOCI) {
                        try {
                            return [2 /*return*/, this.acquireTokenWithCachedRefreshToken(request, true)];
                        }
                        catch (e) {
                            noFamilyRTInCache = e instanceof ClientAuthError && e.errorCode === ClientAuthErrorMessage.noTokensFoundError.code;
                            clientMismatchErrorWithFamilyRT = e instanceof ServerError && e.errorCode === Errors.INVALID_GRANT_ERROR && e.subError === Errors.CLIENT_MISMATCH_ERROR;
                            // if family Refresh Token (FRT) cache acquisition fails or if client_mismatch error is seen with FRT, reattempt with application Refresh Token (ART)
                            if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
                                return [2 /*return*/, this.acquireTokenWithCachedRefreshToken(request, false)];
                                // throw in all other cases
                            }
                            else {
                                throw e;
                            }
                        }
                    }
                    // fall back to application refresh token acquisition
                    return [2 /*return*/, this.acquireTokenWithCachedRefreshToken(request, false)];
                });
            });
        };
        /**
         * makes a network call to acquire tokens by exchanging RefreshToken available in userCache; throws if refresh token is not cached
         * @param request
         */
        RefreshTokenClient.prototype.acquireTokenWithCachedRefreshToken = function (request, foci) {
            return __awaiter(this, void 0, void 0, function () {
                var refreshToken, refreshTokenRequest;
                return __generator(this, function (_a) {
                    refreshToken = this.cacheManager.readRefreshTokenFromCache(this.config.authOptions.clientId, request.account, foci);
                    // no refresh Token
                    if (!refreshToken) {
                        throw ClientAuthError.createNoTokensFoundError();
                    }
                    refreshTokenRequest = __assign(__assign({}, request), { refreshToken: refreshToken.secret, authenticationScheme: request.authenticationScheme || AuthenticationScheme.BEARER, ccsCredential: {
                            credential: request.account.homeAccountId,
                            type: CcsCredentialType.HOME_ACCOUNT_ID
                        } });
                    return [2 /*return*/, this.acquireToken(refreshTokenRequest)];
                });
            });
        };
        /**
         * Constructs the network message and makes a NW call to the underlying secure token service
         * @param request
         * @param authority
         */
        RefreshTokenClient.prototype.executeTokenRequest = function (request, authority) {
            return __awaiter(this, void 0, void 0, function () {
                var requestBody, queryParameters, headers, thumbprint, endpoint;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.createTokenRequestBody(request)];
                        case 1:
                            requestBody = _a.sent();
                            queryParameters = this.createTokenQueryParameters(request);
                            headers = this.createTokenRequestHeaders(request.ccsCredential);
                            thumbprint = {
                                clientId: this.config.authOptions.clientId,
                                authority: authority.canonicalAuthority,
                                scopes: request.scopes
                            };
                            endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParameters);
                            return [2 /*return*/, this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint)];
                    }
                });
            });
        };
        /**
         * Creates query string for the /token request
         * @param request
         */
        RefreshTokenClient.prototype.createTokenQueryParameters = function (request) {
            var parameterBuilder = new RequestParameterBuilder();
            if (request.tokenQueryParameters) {
                parameterBuilder.addExtraQueryParameters(request.tokenQueryParameters);
            }
            return parameterBuilder.createQueryString();
        };
        /**
         * Helper function to create the token request body
         * @param request
         */
        RefreshTokenClient.prototype.createTokenRequestBody = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var parameterBuilder, correlationId, clientAssertion, popTokenGenerator, _a, _b, clientInfo;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            parameterBuilder = new RequestParameterBuilder();
                            parameterBuilder.addClientId(this.config.authOptions.clientId);
                            parameterBuilder.addScopes(request.scopes);
                            parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);
                            parameterBuilder.addClientInfo();
                            parameterBuilder.addLibraryInfo(this.config.libraryInfo);
                            parameterBuilder.addThrottling();
                            if (this.serverTelemetryManager) {
                                parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
                            }
                            correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
                            parameterBuilder.addCorrelationId(correlationId);
                            parameterBuilder.addRefreshToken(request.refreshToken);
                            if (this.config.clientCredentials.clientSecret) {
                                parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret);
                            }
                            if (this.config.clientCredentials.clientAssertion) {
                                clientAssertion = this.config.clientCredentials.clientAssertion;
                                parameterBuilder.addClientAssertion(clientAssertion.assertion);
                                parameterBuilder.addClientAssertionType(clientAssertion.assertionType);
                            }
                            if (!(request.authenticationScheme === AuthenticationScheme.POP)) return [3 /*break*/, 2];
                            popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
                            _b = (_a = parameterBuilder).addPopToken;
                            return [4 /*yield*/, popTokenGenerator.generateCnf(request)];
                        case 1:
                            _b.apply(_a, [_c.sent()]);
                            _c.label = 2;
                        case 2:
                            if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
                                parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
                            }
                            if (this.config.systemOptions.preventCorsPreflight && request.ccsCredential) {
                                switch (request.ccsCredential.type) {
                                    case CcsCredentialType.HOME_ACCOUNT_ID:
                                        try {
                                            clientInfo = buildClientInfoFromHomeAccountId(request.ccsCredential.credential);
                                            parameterBuilder.addCcsOid(clientInfo);
                                        }
                                        catch (e) {
                                            this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                                        }
                                        break;
                                    case CcsCredentialType.UPN:
                                        parameterBuilder.addCcsUpn(request.ccsCredential.credential);
                                        break;
                                }
                            }
                            return [2 /*return*/, parameterBuilder.createQueryString()];
                    }
                });
            });
        };
        return RefreshTokenClient;
    }(BaseClient));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var SilentFlowClient = /** @class */ (function (_super) {
        __extends(SilentFlowClient, _super);
        function SilentFlowClient(configuration) {
            return _super.call(this, configuration) || this;
        }
        /**
         * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
         * the given token and returns the renewed token
         * @param request
         */
        SilentFlowClient.prototype.acquireToken = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var e_1, refreshTokenClient;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.acquireCachedToken(request)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            e_1 = _a.sent();
                            if (e_1 instanceof ClientAuthError && e_1.errorCode === ClientAuthErrorMessage.tokenRefreshRequired.code) {
                                refreshTokenClient = new RefreshTokenClient(this.config);
                                return [2 /*return*/, refreshTokenClient.acquireTokenByRefreshToken(request)];
                            }
                            else {
                                throw e_1;
                            }
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Retrieves token from cache or throws an error if it must be refreshed.
         * @param request
         */
        SilentFlowClient.prototype.acquireCachedToken = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var requestScopes, environment, authScheme, cacheRecord;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Cannot renew token if no request object is given.
                            if (!request) {
                                throw ClientConfigurationError.createEmptyTokenRequestError();
                            }
                            // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
                            if (!request.account) {
                                throw ClientAuthError.createNoAccountInSilentRequestError();
                            }
                            requestScopes = new ScopeSet(request.scopes || []);
                            environment = request.authority || this.authority.getPreferredCache();
                            authScheme = request.authenticationScheme || AuthenticationScheme.BEARER;
                            cacheRecord = this.cacheManager.readCacheRecord(request.account, this.config.authOptions.clientId, requestScopes, environment, authScheme);
                            if (request.forceRefresh ||
                                !StringUtils.isEmptyObj(request.claims) ||
                                !cacheRecord.accessToken ||
                                TimeUtils.isTokenExpired(cacheRecord.accessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds) ||
                                TimeUtils.wasClockTurnedBack(cacheRecord.accessToken.cachedAt) ||
                                (cacheRecord.accessToken.refreshOn && TimeUtils.isTokenExpired(cacheRecord.accessToken.refreshOn, 0))) {
                                // Must refresh due to request parameters, or expired or non-existent access_token
                                throw ClientAuthError.createRefreshRequiredError();
                            }
                            if (this.config.serverTelemetryManager) {
                                this.config.serverTelemetryManager.incrementCacheHits();
                            }
                            return [4 /*yield*/, this.generateResultFromCacheRecord(cacheRecord, request)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Helper function to build response object from the CacheRecord
         * @param cacheRecord
         */
        SilentFlowClient.prototype.generateResultFromCacheRecord = function (cacheRecord, request) {
            return __awaiter(this, void 0, void 0, function () {
                var idTokenObj;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (cacheRecord.idToken) {
                                idTokenObj = new AuthToken(cacheRecord.idToken.secret, this.config.cryptoInterface);
                            }
                            return [4 /*yield*/, ResponseHandler.generateAuthenticationResult(this.cryptoUtils, this.authority, cacheRecord, true, request, idTokenObj)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        return SilentFlowClient;
    }(BaseClient));

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    function isOpenIdConfigResponse(response) {
        return (response.hasOwnProperty("authorization_endpoint") &&
            response.hasOwnProperty("token_endpoint") &&
            response.hasOwnProperty("end_session_endpoint") &&
            response.hasOwnProperty("issuer"));
    }

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Protocol modes supported by MSAL.
     */
    var ProtocolMode;
    (function (ProtocolMode) {
        ProtocolMode["AAD"] = "AAD";
        ProtocolMode["OIDC"] = "OIDC";
    })(ProtocolMode || (ProtocolMode = {}));

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var AuthorityMetadataEntity = /** @class */ (function () {
        function AuthorityMetadataEntity() {
            this.expiresAt = TimeUtils.nowSeconds() + AUTHORITY_METADATA_CONSTANTS.REFRESH_TIME_SECONDS;
        }
        /**
         * Update the entity with new aliases, preferred_cache and preferred_network values
         * @param metadata
         * @param fromNetwork
         */
        AuthorityMetadataEntity.prototype.updateCloudDiscoveryMetadata = function (metadata, fromNetwork) {
            this.aliases = metadata.aliases;
            this.preferred_cache = metadata.preferred_cache;
            this.preferred_network = metadata.preferred_network;
            this.aliasesFromNetwork = fromNetwork;
        };
        /**
         * Update the entity with new endpoints
         * @param metadata
         * @param fromNetwork
         */
        AuthorityMetadataEntity.prototype.updateEndpointMetadata = function (metadata, fromNetwork) {
            this.authorization_endpoint = metadata.authorization_endpoint;
            this.token_endpoint = metadata.token_endpoint;
            this.end_session_endpoint = metadata.end_session_endpoint;
            this.issuer = metadata.issuer;
            this.endpointsFromNetwork = fromNetwork;
        };
        /**
         * Save the authority that was used to create this cache entry
         * @param authority
         */
        AuthorityMetadataEntity.prototype.updateCanonicalAuthority = function (authority) {
            this.canonical_authority = authority;
        };
        /**
         * Reset the exiresAt value
         */
        AuthorityMetadataEntity.prototype.resetExpiresAt = function () {
            this.expiresAt = TimeUtils.nowSeconds() + AUTHORITY_METADATA_CONSTANTS.REFRESH_TIME_SECONDS;
        };
        /**
         * Returns whether or not the data needs to be refreshed
         */
        AuthorityMetadataEntity.prototype.isExpired = function () {
            return this.expiresAt <= TimeUtils.nowSeconds();
        };
        /**
         * Validates an entity: checks for all expected params
         * @param entity
         */
        AuthorityMetadataEntity.isAuthorityMetadataEntity = function (key, entity) {
            if (!entity) {
                return false;
            }
            return (key.indexOf(AUTHORITY_METADATA_CONSTANTS.CACHE_KEY) === 0 &&
                entity.hasOwnProperty("aliases") &&
                entity.hasOwnProperty("preferred_cache") &&
                entity.hasOwnProperty("preferred_network") &&
                entity.hasOwnProperty("canonical_authority") &&
                entity.hasOwnProperty("authorization_endpoint") &&
                entity.hasOwnProperty("token_endpoint") &&
                entity.hasOwnProperty("end_session_endpoint") &&
                entity.hasOwnProperty("issuer") &&
                entity.hasOwnProperty("aliasesFromNetwork") &&
                entity.hasOwnProperty("endpointsFromNetwork") &&
                entity.hasOwnProperty("expiresAt"));
        };
        return AuthorityMetadataEntity;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    function isCloudInstanceDiscoveryResponse(response) {
        return (response.hasOwnProperty("tenant_discovery_endpoint") &&
            response.hasOwnProperty("metadata"));
    }

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var RegionDiscovery = /** @class */ (function () {
        function RegionDiscovery(networkInterface) {
            this.networkInterface = networkInterface;
        }
        /**
         * Detect the region from the application's environment.
         *
         * @returns Promise<string | null>
         */
        RegionDiscovery.prototype.detectRegion = function (environmentRegion) {
            return __awaiter(this, void 0, void 0, function () {
                var autodetectedRegionName, response, latestIMDSVersion, response_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            autodetectedRegionName = environmentRegion;
                            if (!!autodetectedRegionName) return [3 /*break*/, 7];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 6, , 7]);
                            return [4 /*yield*/, this.getRegionFromIMDS(Constants.IMDS_VERSION)];
                        case 2:
                            response = _a.sent();
                            if (response.status === ResponseCodes.httpSuccess) {
                                autodetectedRegionName = response.body;
                            }
                            if (!(response.status === ResponseCodes.httpBadRequest)) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.getCurrentVersion()];
                        case 3:
                            latestIMDSVersion = _a.sent();
                            if (!latestIMDSVersion) {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.getRegionFromIMDS(latestIMDSVersion)];
                        case 4:
                            response_1 = _a.sent();
                            if (response_1.status === ResponseCodes.httpSuccess) {
                                autodetectedRegionName = response_1.body;
                            }
                            _a.label = 5;
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            _a.sent();
                            return [2 /*return*/, null];
                        case 7: return [2 /*return*/, autodetectedRegionName || null];
                    }
                });
            });
        };
        /**
         * Make the call to the IMDS endpoint
         *
         * @param imdsEndpointUrl
         * @returns Promise<NetworkResponse<string>>
         */
        RegionDiscovery.prototype.getRegionFromIMDS = function (version) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.networkInterface.sendGetRequestAsync(Constants.IMDS_ENDPOINT + "?api-version=" + version + "&format=text", RegionDiscovery.IMDS_OPTIONS, Constants.IMDS_TIMEOUT)];
                });
            });
        };
        /**
         * Get the most recent version of the IMDS endpoint available
         *
         * @returns Promise<string | null>
         */
        RegionDiscovery.prototype.getCurrentVersion = function () {
            return __awaiter(this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.networkInterface.sendGetRequestAsync(Constants.IMDS_ENDPOINT + "?format=json", RegionDiscovery.IMDS_OPTIONS)];
                        case 1:
                            response = _a.sent();
                            // When IMDS endpoint is called without the api version query param, bad request response comes back with latest version.
                            if (response.status === ResponseCodes.httpBadRequest && response.body && response.body["newest-versions"] && response.body["newest-versions"].length > 0) {
                                return [2 /*return*/, response.body["newest-versions"][0]];
                            }
                            return [2 /*return*/, null];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, null];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // Options for the IMDS endpoint request
        RegionDiscovery.IMDS_OPTIONS = { headers: { "Metadata": "true" } };
        return RegionDiscovery;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * The authority class validates the authority URIs used by the user, and retrieves the OpenID Configuration Data from the
     * endpoint. It will store the pertinent config data in this object for use during token calls.
     */
    var Authority = /** @class */ (function () {
        function Authority(authority, networkInterface, cacheManager, authorityOptions) {
            this.canonicalAuthority = authority;
            this._canonicalAuthority.validateAsUri();
            this.networkInterface = networkInterface;
            this.cacheManager = cacheManager;
            this.authorityOptions = authorityOptions;
            this.regionDiscovery = new RegionDiscovery(networkInterface);
        }
        Object.defineProperty(Authority.prototype, "authorityType", {
            // See above for AuthorityType
            get: function () {
                var pathSegments = this.canonicalAuthorityUrlComponents.PathSegments;
                if (pathSegments.length && pathSegments[0].toLowerCase() === Constants.ADFS) {
                    return AuthorityType.Adfs;
                }
                return AuthorityType.Default;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "protocolMode", {
            /**
             * ProtocolMode enum representing the way endpoints are constructed.
             */
            get: function () {
                return this.authorityOptions.protocolMode;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "options", {
            /**
             * Returns authorityOptions which can be used to reinstantiate a new authority instance
             */
            get: function () {
                return this.authorityOptions;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "canonicalAuthority", {
            /**
             * A URL that is the authority set by the developer
             */
            get: function () {
                return this._canonicalAuthority.urlString;
            },
            /**
             * Sets canonical authority.
             */
            set: function (url) {
                this._canonicalAuthority = new UrlString(url);
                this._canonicalAuthority.validateAsUri();
                this._canonicalAuthorityUrlComponents = null;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "canonicalAuthorityUrlComponents", {
            /**
             * Get authority components.
             */
            get: function () {
                if (!this._canonicalAuthorityUrlComponents) {
                    this._canonicalAuthorityUrlComponents = this._canonicalAuthority.getUrlComponents();
                }
                return this._canonicalAuthorityUrlComponents;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "hostnameAndPort", {
            /**
             * Get hostname and port i.e. login.microsoftonline.com
             */
            get: function () {
                return this.canonicalAuthorityUrlComponents.HostNameAndPort.toLowerCase();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "tenant", {
            /**
             * Get tenant for authority.
             */
            get: function () {
                return this.canonicalAuthorityUrlComponents.PathSegments[0];
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "authorizationEndpoint", {
            /**
             * OAuth /authorize endpoint for requests
             */
            get: function () {
                if (this.discoveryComplete()) {
                    var endpoint = this.replacePath(this.metadata.authorization_endpoint);
                    return this.replaceTenant(endpoint);
                }
                else {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "tokenEndpoint", {
            /**
             * OAuth /token endpoint for requests
             */
            get: function () {
                if (this.discoveryComplete()) {
                    var endpoint = this.replacePath(this.metadata.token_endpoint);
                    return this.replaceTenant(endpoint);
                }
                else {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "deviceCodeEndpoint", {
            get: function () {
                if (this.discoveryComplete()) {
                    var endpoint = this.replacePath(this.metadata.token_endpoint.replace("/token", "/devicecode"));
                    return this.replaceTenant(endpoint);
                }
                else {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "endSessionEndpoint", {
            /**
             * OAuth logout endpoint for requests
             */
            get: function () {
                if (this.discoveryComplete()) {
                    var endpoint = this.replacePath(this.metadata.end_session_endpoint);
                    return this.replaceTenant(endpoint);
                }
                else {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "selfSignedJwtAudience", {
            /**
             * OAuth issuer for requests
             */
            get: function () {
                if (this.discoveryComplete()) {
                    var endpoint = this.replacePath(this.metadata.issuer);
                    return this.replaceTenant(endpoint);
                }
                else {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
                }
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Replaces tenant in url path with current tenant. Defaults to common.
         * @param urlString
         */
        Authority.prototype.replaceTenant = function (urlString) {
            return urlString.replace(/{tenant}|{tenantid}/g, this.tenant);
        };
        /**
         * Replaces path such as tenant or policy with the current tenant or policy.
         * @param urlString
         */
        Authority.prototype.replacePath = function (urlString) {
            var endpoint = urlString;
            var cachedAuthorityUrl = new UrlString(this.metadata.canonical_authority);
            var cachedAuthorityParts = cachedAuthorityUrl.getUrlComponents().PathSegments;
            var currentAuthorityParts = this.canonicalAuthorityUrlComponents.PathSegments;
            currentAuthorityParts.forEach(function (currentPart, index) {
                var cachedPart = cachedAuthorityParts[index];
                if (currentPart !== cachedPart) {
                    endpoint = endpoint.replace("/" + cachedPart + "/", "/" + currentPart + "/");
                }
            });
            return endpoint;
        };
        Object.defineProperty(Authority.prototype, "defaultOpenIdConfigurationEndpoint", {
            /**
             * The default open id configuration endpoint for any canonical authority.
             */
            get: function () {
                if (this.authorityType === AuthorityType.Adfs || this.protocolMode === ProtocolMode.OIDC) {
                    return this.canonicalAuthority + ".well-known/openid-configuration";
                }
                return this.canonicalAuthority + "v2.0/.well-known/openid-configuration";
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Boolean that returns whethr or not tenant discovery has been completed.
         */
        Authority.prototype.discoveryComplete = function () {
            return !!this.metadata;
        };
        /**
         * Perform endpoint discovery to discover aliases, preferred_cache, preferred_network
         * and the /authorize, /token and logout endpoints.
         */
        Authority.prototype.resolveEndpointsAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var metadataEntity, cloudDiscoverySource, endpointSource, cacheKey;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            metadataEntity = this.cacheManager.getAuthorityMetadataByAlias(this.hostnameAndPort);
                            if (!metadataEntity) {
                                metadataEntity = new AuthorityMetadataEntity();
                                metadataEntity.updateCanonicalAuthority(this.canonicalAuthority);
                            }
                            return [4 /*yield*/, this.updateCloudDiscoveryMetadata(metadataEntity)];
                        case 1:
                            cloudDiscoverySource = _a.sent();
                            this.canonicalAuthority = this.canonicalAuthority.replace(this.hostnameAndPort, metadataEntity.preferred_network);
                            return [4 /*yield*/, this.updateEndpointMetadata(metadataEntity)];
                        case 2:
                            endpointSource = _a.sent();
                            if (cloudDiscoverySource !== AuthorityMetadataSource.CACHE && endpointSource !== AuthorityMetadataSource.CACHE) {
                                // Reset the expiration time unless both values came from a successful cache lookup
                                metadataEntity.resetExpiresAt();
                                metadataEntity.updateCanonicalAuthority(this.canonicalAuthority);
                            }
                            cacheKey = this.cacheManager.generateAuthorityMetadataCacheKey(metadataEntity.preferred_cache);
                            this.cacheManager.setAuthorityMetadata(cacheKey, metadataEntity);
                            this.metadata = metadataEntity;
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Update AuthorityMetadataEntity with new endpoints and return where the information came from
         * @param metadataEntity
         */
        Authority.prototype.updateEndpointMetadata = function (metadataEntity) {
            var _a;
            return __awaiter(this, void 0, void 0, function () {
                var metadata, autodetectedRegionName, azureRegion;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            metadata = this.getEndpointMetadataFromConfig();
                            if (metadata) {
                                metadataEntity.updateEndpointMetadata(metadata, false);
                                return [2 /*return*/, AuthorityMetadataSource.CONFIG];
                            }
                            if (this.isAuthoritySameType(metadataEntity) && metadataEntity.endpointsFromNetwork && !metadataEntity.isExpired()) {
                                // No need to update
                                return [2 /*return*/, AuthorityMetadataSource.CACHE];
                            }
                            return [4 /*yield*/, this.getEndpointMetadataFromNetwork()];
                        case 1:
                            metadata = _b.sent();
                            if (!metadata) return [3 /*break*/, 4];
                            if (!((_a = this.authorityOptions.azureRegionConfiguration) === null || _a === void 0 ? void 0 : _a.azureRegion)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.regionDiscovery.detectRegion(this.authorityOptions.azureRegionConfiguration.environmentRegion)];
                        case 2:
                            autodetectedRegionName = _b.sent();
                            azureRegion = this.authorityOptions.azureRegionConfiguration.azureRegion === Constants.AZURE_REGION_AUTO_DISCOVER_FLAG
                                ? autodetectedRegionName
                                : this.authorityOptions.azureRegionConfiguration.azureRegion;
                            if (azureRegion) {
                                metadata = Authority.replaceWithRegionalInformation(metadata, azureRegion);
                            }
                            _b.label = 3;
                        case 3:
                            metadataEntity.updateEndpointMetadata(metadata, true);
                            return [2 /*return*/, AuthorityMetadataSource.NETWORK];
                        case 4: throw ClientAuthError.createUnableToGetOpenidConfigError(this.defaultOpenIdConfigurationEndpoint);
                    }
                });
            });
        };
        /**
         * Compares the number of url components after the domain to determine if the cached authority metadata can be used for the requested authority
         * Protects against same domain different authority such as login.microsoftonline.com/tenant and login.microsoftonline.com/tfp/tenant/policy
         * @param metadataEntity
         */
        Authority.prototype.isAuthoritySameType = function (metadataEntity) {
            var cachedAuthorityUrl = new UrlString(metadataEntity.canonical_authority);
            var cachedParts = cachedAuthorityUrl.getUrlComponents().PathSegments;
            return cachedParts.length === this.canonicalAuthorityUrlComponents.PathSegments.length;
        };
        /**
         * Parse authorityMetadata config option
         */
        Authority.prototype.getEndpointMetadataFromConfig = function () {
            if (this.authorityOptions.authorityMetadata) {
                try {
                    return JSON.parse(this.authorityOptions.authorityMetadata);
                }
                catch (e) {
                    throw ClientConfigurationError.createInvalidAuthorityMetadataError();
                }
            }
            return null;
        };
        /**
         * Gets OAuth endpoints from the given OpenID configuration endpoint.
         */
        Authority.prototype.getEndpointMetadataFromNetwork = function () {
            return __awaiter(this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.networkInterface.sendGetRequestAsync(this.defaultOpenIdConfigurationEndpoint)];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, isOpenIdConfigResponse(response.body) ? response.body : null];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, null];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Updates the AuthorityMetadataEntity with new aliases, preferred_network and preferred_cache and returns where the information was retrived from
         * @param cachedMetadata
         * @param newMetadata
         */
        Authority.prototype.updateCloudDiscoveryMetadata = function (metadataEntity) {
            return __awaiter(this, void 0, void 0, function () {
                var metadata;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            metadata = this.getCloudDiscoveryMetadataFromConfig();
                            if (metadata) {
                                metadataEntity.updateCloudDiscoveryMetadata(metadata, false);
                                return [2 /*return*/, AuthorityMetadataSource.CONFIG];
                            }
                            // If The cached metadata came from config but that config was not passed to this instance, we must go to the network
                            if (this.isAuthoritySameType(metadataEntity) && metadataEntity.aliasesFromNetwork && !metadataEntity.isExpired()) {
                                // No need to update
                                return [2 /*return*/, AuthorityMetadataSource.CACHE];
                            }
                            return [4 /*yield*/, this.getCloudDiscoveryMetadataFromNetwork()];
                        case 1:
                            metadata = _a.sent();
                            if (metadata) {
                                metadataEntity.updateCloudDiscoveryMetadata(metadata, true);
                                return [2 /*return*/, AuthorityMetadataSource.NETWORK];
                            }
                            else {
                                // Metadata could not be obtained from config, cache or network
                                throw ClientConfigurationError.createUntrustedAuthorityError();
                            }
                    }
                });
            });
        };
        /**
         * Parse cloudDiscoveryMetadata config or check knownAuthorities
         */
        Authority.prototype.getCloudDiscoveryMetadataFromConfig = function () {
            // Check if network response was provided in config
            if (this.authorityOptions.cloudDiscoveryMetadata) {
                try {
                    var parsedResponse = JSON.parse(this.authorityOptions.cloudDiscoveryMetadata);
                    var metadata = Authority.getCloudDiscoveryMetadataFromNetworkResponse(parsedResponse.metadata, this.hostnameAndPort);
                    if (metadata) {
                        return metadata;
                    }
                }
                catch (e) {
                    throw ClientConfigurationError.createInvalidCloudDiscoveryMetadataError();
                }
            }
            // If cloudDiscoveryMetadata is empty or does not contain the host, check knownAuthorities
            if (this.isInKnownAuthorities()) {
                return Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
            }
            return null;
        };
        /**
         * Called to get metadata from network if CloudDiscoveryMetadata was not populated by config
         * @param networkInterface
         */
        Authority.prototype.getCloudDiscoveryMetadataFromNetwork = function () {
            return __awaiter(this, void 0, void 0, function () {
                var instanceDiscoveryEndpoint, match, response, metadata;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            instanceDiscoveryEndpoint = "" + Constants.AAD_INSTANCE_DISCOVERY_ENDPT + this.canonicalAuthority + "oauth2/v2.0/authorize";
                            match = null;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.networkInterface.sendGetRequestAsync(instanceDiscoveryEndpoint)];
                        case 2:
                            response = _a.sent();
                            metadata = isCloudInstanceDiscoveryResponse(response.body) ? response.body.metadata : [];
                            if (metadata.length === 0) {
                                // If no metadata is returned, authority is untrusted
                                return [2 /*return*/, null];
                            }
                            match = Authority.getCloudDiscoveryMetadataFromNetworkResponse(metadata, this.hostnameAndPort);
                            return [3 /*break*/, 4];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, null];
                        case 4:
                            if (!match) {
                                // Custom Domain scenario, host is trusted because Instance Discovery call succeeded 
                                match = Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
                            }
                            return [2 /*return*/, match];
                    }
                });
            });
        };
        /**
         * Helper function to determine if this host is included in the knownAuthorities config option
         */
        Authority.prototype.isInKnownAuthorities = function () {
            var _this = this;
            var matches = this.authorityOptions.knownAuthorities.filter(function (authority) {
                return UrlString.getDomainFromUrl(authority).toLowerCase() === _this.hostnameAndPort;
            });
            return matches.length > 0;
        };
        /**
         * Creates cloud discovery metadata object from a given host
         * @param host
         */
        Authority.createCloudDiscoveryMetadataFromHost = function (host) {
            return {
                preferred_network: host,
                preferred_cache: host,
                aliases: [host]
            };
        };
        /**
         * Searches instance discovery network response for the entry that contains the host in the aliases list
         * @param response
         * @param authority
         */
        Authority.getCloudDiscoveryMetadataFromNetworkResponse = function (response, authority) {
            for (var i = 0; i < response.length; i++) {
                var metadata = response[i];
                if (metadata.aliases.indexOf(authority) > -1) {
                    return metadata;
                }
            }
            return null;
        };
        /**
         * helper function to generate environment from authority object
         */
        Authority.prototype.getPreferredCache = function () {
            if (this.discoveryComplete()) {
                return this.metadata.preferred_cache;
            }
            else {
                throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
            }
        };
        /**
         * Returns whether or not the provided host is an alias of this authority instance
         * @param host
         */
        Authority.prototype.isAlias = function (host) {
            return this.metadata.aliases.indexOf(host) > -1;
        };
        /**
         * Checks whether the provided host is that of a public cloud authority
         *
         * @param authority string
         * @returns bool
         */
        Authority.isPublicCloudAuthority = function (host) {
            return Constants.KNOWN_PUBLIC_CLOUDS.indexOf(host) >= 0;
        };
        /**
         * Rebuild the authority string with the region
         *
         * @param host string
         * @param region string
         */
        Authority.buildRegionalAuthorityString = function (host, region, queryString) {
            // Create and validate a Url string object with the initial authority string
            var authorityUrlInstance = new UrlString(host);
            authorityUrlInstance.validateAsUri();
            var authorityUrlParts = authorityUrlInstance.getUrlComponents();
            var hostNameAndPort = region + "." + authorityUrlParts.HostNameAndPort;
            if (this.isPublicCloudAuthority(authorityUrlParts.HostNameAndPort)) {
                hostNameAndPort = region + "." + Constants.REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX;
            }
            // Include the query string portion of the url
            var url = UrlString.constructAuthorityUriFromObject(__assign(__assign({}, authorityUrlInstance.getUrlComponents()), { HostNameAndPort: hostNameAndPort })).urlString;
            // Add the query string if a query string was provided
            if (queryString)
                return url + "?" + queryString;
            return url;
        };
        /**
         * Replace the endpoints in the metadata object with their regional equivalents.
         *
         * @param metadata OpenIdConfigResponse
         * @param azureRegion string
         */
        Authority.replaceWithRegionalInformation = function (metadata, azureRegion) {
            metadata.authorization_endpoint = Authority.buildRegionalAuthorityString(metadata.authorization_endpoint, azureRegion);
            // TODO: Enquire on whether we should leave the query string or remove it before releasing the feature
            metadata.token_endpoint = Authority.buildRegionalAuthorityString(metadata.token_endpoint, azureRegion, "allowestsrnonmsi=true");
            metadata.end_session_endpoint = Authority.buildRegionalAuthorityString(metadata.end_session_endpoint, azureRegion);
            return metadata;
        };
        return Authority;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var AuthorityFactory = /** @class */ (function () {
        function AuthorityFactory() {
        }
        /**
         * Create an authority object of the correct type based on the url
         * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
         *
         * Also performs endpoint discovery.
         *
         * @param authorityUri
         * @param networkClient
         * @param protocolMode
         */
        AuthorityFactory.createDiscoveredInstance = function (authorityUri, networkClient, cacheManager, authorityOptions) {
            return __awaiter(this, void 0, void 0, function () {
                var acquireTokenAuthority, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            acquireTokenAuthority = AuthorityFactory.createInstance(authorityUri, networkClient, cacheManager, authorityOptions);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, acquireTokenAuthority.resolveEndpointsAsync()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, acquireTokenAuthority];
                        case 3:
                            e_1 = _a.sent();
                            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e_1);
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Create an authority object of the correct type based on the url
         * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
         *
         * Does not perform endpoint discovery.
         *
         * @param authorityUrl
         * @param networkInterface
         * @param protocolMode
         */
        AuthorityFactory.createInstance = function (authorityUrl, networkInterface, cacheManager, authorityOptions) {
            // Throw error if authority url is empty
            if (StringUtils.isEmpty(authorityUrl)) {
                throw ClientConfigurationError.createUrlEmptyError();
            }
            return new Authority(authorityUrl, networkInterface, cacheManager, authorityOptions);
        };
        return AuthorityFactory;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var ServerTelemetryEntity = /** @class */ (function () {
        function ServerTelemetryEntity() {
            this.failedRequests = [];
            this.errors = [];
            this.cacheHits = 0;
        }
        /**
         * validates if a given cache entry is "Telemetry", parses <key,value>
         * @param key
         * @param entity
         */
        ServerTelemetryEntity.isServerTelemetryEntity = function (key, entity) {
            var validateKey = key.indexOf(SERVER_TELEM_CONSTANTS.CACHE_KEY) === 0;
            var validateEntity = true;
            if (entity) {
                validateEntity =
                    entity.hasOwnProperty("failedRequests") &&
                        entity.hasOwnProperty("errors") &&
                        entity.hasOwnProperty("cacheHits");
            }
            return validateKey && validateEntity;
        };
        return ServerTelemetryEntity;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var ThrottlingEntity = /** @class */ (function () {
        function ThrottlingEntity() {
        }
        /**
         * validates if a given cache entry is "Throttling", parses <key,value>
         * @param key
         * @param entity
         */
        ThrottlingEntity.isThrottlingEntity = function (key, entity) {
            var validateKey = false;
            if (key) {
                validateKey = key.indexOf(ThrottlingConstants.THROTTLING_PREFIX) === 0;
            }
            var validateEntity = true;
            if (entity) {
                validateEntity = entity.hasOwnProperty("throttleTime");
            }
            return validateKey && validateEntity;
        };
        return ThrottlingEntity;
    }());

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var StubbedNetworkModule = {
        sendGetRequestAsync: function () {
            var notImplErr = "Network interface - sendGetRequestAsync() has not been implemented for the Network interface.";
            return Promise.reject(AuthError.createUnexpectedError(notImplErr));
        },
        sendPostRequestAsync: function () {
            var notImplErr = "Network interface - sendPostRequestAsync() has not been implemented for the Network interface.";
            return Promise.reject(AuthError.createUnexpectedError(notImplErr));
        }
    };

    /*! @azure/msal-common v4.4.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var ServerTelemetryManager = /** @class */ (function () {
        function ServerTelemetryManager(telemetryRequest, cacheManager) {
            this.cacheManager = cacheManager;
            this.apiId = telemetryRequest.apiId;
            this.correlationId = telemetryRequest.correlationId;
            this.forceRefresh = telemetryRequest.forceRefresh || false;
            this.wrapperSKU = telemetryRequest.wrapperSKU || Constants.EMPTY_STRING;
            this.wrapperVer = telemetryRequest.wrapperVer || Constants.EMPTY_STRING;
            this.telemetryCacheKey = SERVER_TELEM_CONSTANTS.CACHE_KEY + Separators.CACHE_KEY_SEPARATOR + telemetryRequest.clientId;
        }
        /**
         * API to add MSER Telemetry to request
         */
        ServerTelemetryManager.prototype.generateCurrentRequestHeaderValue = function () {
            var forceRefreshInt = this.forceRefresh ? 1 : 0;
            var request = "" + this.apiId + SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR + forceRefreshInt;
            var platformFields = [this.wrapperSKU, this.wrapperVer].join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
            return [SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, request, platformFields].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
        };
        /**
         * API to add MSER Telemetry for the last failed request
         */
        ServerTelemetryManager.prototype.generateLastRequestHeaderValue = function () {
            var lastRequests = this.getLastRequests();
            var maxErrors = ServerTelemetryManager.maxErrorsToSend(lastRequests);
            var failedRequests = lastRequests.failedRequests.slice(0, 2 * maxErrors).join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
            var errors = lastRequests.errors.slice(0, maxErrors).join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
            var errorCount = lastRequests.errors.length;
            // Indicate whether this header contains all data or partial data
            var overflow = maxErrors < errorCount ? SERVER_TELEM_CONSTANTS.OVERFLOW_TRUE : SERVER_TELEM_CONSTANTS.OVERFLOW_FALSE;
            var platformFields = [errorCount, overflow].join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
            return [SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, lastRequests.cacheHits, failedRequests, errors, platformFields].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
        };
        /**
         * API to cache token failures for MSER data capture
         * @param error
         */
        ServerTelemetryManager.prototype.cacheFailedRequest = function (error) {
            var lastRequests = this.getLastRequests();
            if (lastRequests.errors.length >= SERVER_TELEM_CONSTANTS.MAX_CACHED_ERRORS) {
                // Remove a cached error to make room, first in first out
                lastRequests.failedRequests.shift(); // apiId
                lastRequests.failedRequests.shift(); // correlationId
                lastRequests.errors.shift();
            }
            lastRequests.failedRequests.push(this.apiId, this.correlationId);
            if (!StringUtils.isEmpty(error.subError)) {
                lastRequests.errors.push(error.subError);
            }
            else if (!StringUtils.isEmpty(error.errorCode)) {
                lastRequests.errors.push(error.errorCode);
            }
            else if (!!error && error.toString()) {
                lastRequests.errors.push(error.toString());
            }
            else {
                lastRequests.errors.push(SERVER_TELEM_CONSTANTS.UNKNOWN_ERROR);
            }
            this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests);
            return;
        };
        /**
         * Update server telemetry cache entry by incrementing cache hit counter
         */
        ServerTelemetryManager.prototype.incrementCacheHits = function () {
            var lastRequests = this.getLastRequests();
            lastRequests.cacheHits += 1;
            this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests);
            return lastRequests.cacheHits;
        };
        /**
         * Get the server telemetry entity from cache or initialize a new one
         */
        ServerTelemetryManager.prototype.getLastRequests = function () {
            var initialValue = new ServerTelemetryEntity();
            var lastRequests = this.cacheManager.getServerTelemetry(this.telemetryCacheKey);
            return lastRequests || initialValue;
        };
        /**
         * Remove server telemetry cache entry
         */
        ServerTelemetryManager.prototype.clearTelemetryCache = function () {
            var lastRequests = this.getLastRequests();
            var numErrorsFlushed = ServerTelemetryManager.maxErrorsToSend(lastRequests);
            var errorCount = lastRequests.errors.length;
            if (numErrorsFlushed === errorCount) {
                // All errors were sent on last request, clear Telemetry cache
                this.cacheManager.removeItem(this.telemetryCacheKey);
            }
            else {
                // Partial data was flushed to server, construct a new telemetry cache item with errors that were not flushed
                var serverTelemEntity = new ServerTelemetryEntity();
                serverTelemEntity.failedRequests = lastRequests.failedRequests.slice(numErrorsFlushed * 2); // failedRequests contains 2 items for each error
                serverTelemEntity.errors = lastRequests.errors.slice(numErrorsFlushed);
                this.cacheManager.setServerTelemetry(this.telemetryCacheKey, serverTelemEntity);
            }
        };
        /**
         * Returns the maximum number of errors that can be flushed to the server in the next network request
         * @param serverTelemetryEntity
         */
        ServerTelemetryManager.maxErrorsToSend = function (serverTelemetryEntity) {
            var i;
            var maxErrors = 0;
            var dataSize = 0;
            var errorCount = serverTelemetryEntity.errors.length;
            for (i = 0; i < errorCount; i++) {
                // failedRequests parameter contains pairs of apiId and correlationId, multiply index by 2 to preserve pairs
                var apiId = serverTelemetryEntity.failedRequests[2 * i] || Constants.EMPTY_STRING;
                var correlationId = serverTelemetryEntity.failedRequests[2 * i + 1] || Constants.EMPTY_STRING;
                var errorCode = serverTelemetryEntity.errors[i] || Constants.EMPTY_STRING;
                // Count number of characters that would be added to header, each character is 1 byte. Add 3 at the end to account for separators
                dataSize += apiId.toString().length + correlationId.toString().length + errorCode.length + 3;
                if (dataSize < SERVER_TELEM_CONSTANTS.MAX_LAST_HEADER_BYTES) {
                    // Adding this entry to the header would still keep header size below the limit
                    maxErrors += 1;
                }
                else {
                    break;
                }
            }
            return maxErrors;
        };
        return ServerTelemetryManager;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Constants
     */
    var BrowserConstants = {
        /**
         * Interaction in progress cache value
         */
        INTERACTION_IN_PROGRESS_VALUE: "interaction_in_progress",
        /**
         * Invalid grant error code
         */
        INVALID_GRANT_ERROR: "invalid_grant",
        /**
         * Default popup window width
         */
        POPUP_WIDTH: 483,
        /**
         * Default popup window height
         */
        POPUP_HEIGHT: 600,
        /**
         * Name of the popup window starts with
         */
        POPUP_NAME_PREFIX: "msal",
        /**
         * Default popup monitor poll interval in milliseconds
         */
        POLL_INTERVAL_MS: 50,
        /**
         * Msal-browser SKU
         */
        MSAL_SKU: "msal.js.browser",
    };
    var BrowserCacheLocation;
    (function (BrowserCacheLocation) {
        BrowserCacheLocation["LocalStorage"] = "localStorage";
        BrowserCacheLocation["SessionStorage"] = "sessionStorage";
        BrowserCacheLocation["MemoryStorage"] = "memoryStorage";
    })(BrowserCacheLocation || (BrowserCacheLocation = {}));
    /**
     * HTTP Request types supported by MSAL.
     */
    var HTTP_REQUEST_TYPE;
    (function (HTTP_REQUEST_TYPE) {
        HTTP_REQUEST_TYPE["GET"] = "GET";
        HTTP_REQUEST_TYPE["POST"] = "POST";
    })(HTTP_REQUEST_TYPE || (HTTP_REQUEST_TYPE = {}));
    /**
     * Temporary cache keys for MSAL, deleted after any request.
     */
    var TemporaryCacheKeys;
    (function (TemporaryCacheKeys) {
        TemporaryCacheKeys["AUTHORITY"] = "authority";
        TemporaryCacheKeys["ACQUIRE_TOKEN_ACCOUNT"] = "acquireToken.account";
        TemporaryCacheKeys["SESSION_STATE"] = "session.state";
        TemporaryCacheKeys["REQUEST_STATE"] = "request.state";
        TemporaryCacheKeys["NONCE_IDTOKEN"] = "nonce.id_token";
        TemporaryCacheKeys["ORIGIN_URI"] = "request.origin";
        TemporaryCacheKeys["RENEW_STATUS"] = "token.renew.status";
        TemporaryCacheKeys["URL_HASH"] = "urlHash";
        TemporaryCacheKeys["REQUEST_PARAMS"] = "request.params";
        TemporaryCacheKeys["SCOPES"] = "scopes";
        TemporaryCacheKeys["INTERACTION_STATUS_KEY"] = "interaction.status";
        TemporaryCacheKeys["CCS_CREDENTIAL"] = "ccs.credential";
    })(TemporaryCacheKeys || (TemporaryCacheKeys = {}));
    /**
     * API Codes for Telemetry purposes.
     * Before adding a new code you must claim it in the MSAL Telemetry tracker as these number spaces are shared across all MSALs
     * 0-99 Silent Flow
     * 800-899 Auth Code Flow
     */
    var ApiId;
    (function (ApiId) {
        ApiId[ApiId["acquireTokenRedirect"] = 861] = "acquireTokenRedirect";
        ApiId[ApiId["acquireTokenPopup"] = 862] = "acquireTokenPopup";
        ApiId[ApiId["ssoSilent"] = 863] = "ssoSilent";
        ApiId[ApiId["acquireTokenSilent_authCode"] = 864] = "acquireTokenSilent_authCode";
        ApiId[ApiId["handleRedirectPromise"] = 865] = "handleRedirectPromise";
        ApiId[ApiId["acquireTokenSilent_silentFlow"] = 61] = "acquireTokenSilent_silentFlow";
        ApiId[ApiId["logout"] = 961] = "logout";
        ApiId[ApiId["logoutPopup"] = 962] = "logoutPopup";
    })(ApiId || (ApiId = {}));
    /*
     * Interaction type of the API - used for state and telemetry
     */
    var InteractionType;
    (function (InteractionType) {
        InteractionType["Redirect"] = "redirect";
        InteractionType["Popup"] = "popup";
        InteractionType["Silent"] = "silent";
    })(InteractionType || (InteractionType = {}));
    /**
     * Types of interaction currently in progress.
     * Used in events in wrapper libraries to invoke functions when certain interaction is in progress or all interactions are complete.
     */
    var InteractionStatus;
    (function (InteractionStatus) {
        /**
         * Initial status before interaction occurs
         */
        InteractionStatus["Startup"] = "startup";
        /**
         * Status set when all login calls occuring
         */
        InteractionStatus["Login"] = "login";
        /**
         * Status set when logout call occuring
         */
        InteractionStatus["Logout"] = "logout";
        /**
         * Status set for acquireToken calls
         */
        InteractionStatus["AcquireToken"] = "acquireToken";
        /**
         * Status set for ssoSilent calls
         */
        InteractionStatus["SsoSilent"] = "ssoSilent";
        /**
         * Status set when handleRedirect in progress
         */
        InteractionStatus["HandleRedirect"] = "handleRedirect";
        /**
         * Status set when interaction is complete
         */
        InteractionStatus["None"] = "none";
    })(InteractionStatus || (InteractionStatus = {}));
    var DEFAULT_REQUEST = {
        scopes: OIDC_DEFAULT_SCOPES
    };
    /**
     * JWK Key Format string (Type MUST be defined for window crypto APIs)
     */
    var KEY_FORMAT_JWK = "jwk";
    // Supported wrapper SKUs
    var WrapperSKU;
    (function (WrapperSKU) {
        WrapperSKU["React"] = "@azure/msal-react";
        WrapperSKU["Angular"] = "@azure/msal-angular";
    })(WrapperSKU || (WrapperSKU = {}));

    /*! @azure/msal-browser v2.15.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Utility class for math specific functions in browser.
     */
    var MathUtils = /** @class */ (function () {
        function MathUtils() {
        }
        /**
         * Decimal to Hex
         *
         * @param num
         */
        MathUtils.decimalToHex = function (num) {
            var hex = num.toString(16);
            while (hex.length < 2) {
                hex = "0" + hex;
            }
            return hex;
        };
        return MathUtils;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var GuidGenerator = /** @class */ (function () {
        function GuidGenerator(cryptoObj) {
            this.cryptoObj = cryptoObj;
        }
        /*
         * RFC4122: The version 4 UUID is meant for generating UUIDs from truly-random or
         * pseudo-random numbers.
         * The algorithm is as follows:
         *     Set the two most significant bits (bits 6 and 7) of the
         *        clock_seq_hi_and_reserved to zero and one, respectively.
         *     Set the four most significant bits (bits 12 through 15) of the
         *        time_hi_and_version field to the 4-bit version number from
         *        Section 4.1.3. Version4
         *     Set all the other bits to randomly (or pseudo-randomly) chosen
         *     values.
         * UUID                   = time-low "-" time-mid "-"time-high-and-version "-"clock-seq-reserved and low(2hexOctet)"-" node
         * time-low               = 4hexOctet
         * time-mid               = 2hexOctet
         * time-high-and-version  = 2hexOctet
         * clock-seq-and-reserved = hexOctet:
         * clock-seq-low          = hexOctet
         * node                   = 6hexOctet
         * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
         * y could be 1000, 1001, 1010, 1011 since most significant two bits needs to be 10
         * y values are 8, 9, A, B
         */
        GuidGenerator.prototype.generateGuid = function () {
            try {
                var buffer = new Uint8Array(16);
                this.cryptoObj.getRandomValues(buffer);
                // buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
                buffer[6] |= 0x40; // buffer[6] | 01000000 will set the 6 bit to 1.
                buffer[6] &= 0x4f; // buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".
                // buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
                buffer[8] |= 0x80; // buffer[8] | 10000000 will set the 7 bit to 1.
                buffer[8] &= 0xbf; // buffer[8] & 10111111 will set the 6 bit to 0.
                return MathUtils.decimalToHex(buffer[0]) + MathUtils.decimalToHex(buffer[1])
                    + MathUtils.decimalToHex(buffer[2]) + MathUtils.decimalToHex(buffer[3])
                    + "-" + MathUtils.decimalToHex(buffer[4]) + MathUtils.decimalToHex(buffer[5])
                    + "-" + MathUtils.decimalToHex(buffer[6]) + MathUtils.decimalToHex(buffer[7])
                    + "-" + MathUtils.decimalToHex(buffer[8]) + MathUtils.decimalToHex(buffer[9])
                    + "-" + MathUtils.decimalToHex(buffer[10]) + MathUtils.decimalToHex(buffer[11])
                    + MathUtils.decimalToHex(buffer[12]) + MathUtils.decimalToHex(buffer[13])
                    + MathUtils.decimalToHex(buffer[14]) + MathUtils.decimalToHex(buffer[15]);
            }
            catch (err) {
                var guidHolder = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
                var hex = "0123456789abcdef";
                var r = 0;
                var guidResponse = "";
                for (var i = 0; i < 36; i++) {
                    if (guidHolder[i] !== "-" && guidHolder[i] !== "4") {
                        // each x and y needs to be random
                        r = Math.random() * 16 | 0;
                    }
                    if (guidHolder[i] === "x") {
                        guidResponse += hex[r];
                    }
                    else if (guidHolder[i] === "y") {
                        // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                        r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                        r |= 0x8; // set pos 3 to 1 as 1???
                        guidResponse += hex[r];
                    }
                    else {
                        guidResponse += guidHolder[i];
                    }
                }
                return guidResponse;
            }
        };
        /**
         * verifies if a string is  GUID
         * @param guid
         */
        GuidGenerator.isGuid = function (guid) {
            var regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return regexGuid.test(guid);
        };
        return GuidGenerator;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Utility functions for strings in a browser. See here for implementation details:
     * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_JavaScript's_UTF-16_%3E_UTF-8_%3E_base64
     */
    var BrowserStringUtils = /** @class */ (function () {
        function BrowserStringUtils() {
        }
        /**
         * Converts string to Uint8Array
         * @param sDOMStr
         */
        BrowserStringUtils.stringToUtf8Arr = function (sDOMStr) {
            var nChr;
            var nArrLen = 0;
            var nStrLen = sDOMStr.length;
            /* mapping... */
            for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
                nChr = sDOMStr.charCodeAt(nMapIdx);
                nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
            }
            var aBytes = new Uint8Array(nArrLen);
            /* transcription... */
            for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
                nChr = sDOMStr.charCodeAt(nChrIdx);
                if (nChr < 128) {
                    /* one byte */
                    aBytes[nIdx++] = nChr;
                }
                else if (nChr < 0x800) {
                    /* two bytes */
                    aBytes[nIdx++] = 192 + (nChr >>> 6);
                    aBytes[nIdx++] = 128 + (nChr & 63);
                }
                else if (nChr < 0x10000) {
                    /* three bytes */
                    aBytes[nIdx++] = 224 + (nChr >>> 12);
                    aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                    aBytes[nIdx++] = 128 + (nChr & 63);
                }
                else if (nChr < 0x200000) {
                    /* four bytes */
                    aBytes[nIdx++] = 240 + (nChr >>> 18);
                    aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                    aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                    aBytes[nIdx++] = 128 + (nChr & 63);
                }
                else if (nChr < 0x4000000) {
                    /* five bytes */
                    aBytes[nIdx++] = 248 + (nChr >>> 24);
                    aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
                    aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                    aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                    aBytes[nIdx++] = 128 + (nChr & 63);
                }
                else /* if (nChr <= 0x7fffffff) */ {
                    /* six bytes */
                    aBytes[nIdx++] = 252 + (nChr >>> 30);
                    aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
                    aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
                    aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                    aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                    aBytes[nIdx++] = 128 + (nChr & 63);
                }
            }
            return aBytes;
        };
        /**
         * Converst string to ArrayBuffer
         * @param dataString
         */
        BrowserStringUtils.stringToArrayBuffer = function (dataString) {
            var data = new ArrayBuffer(dataString.length);
            var dataView = new Uint8Array(data);
            for (var i = 0; i < dataString.length; i++) {
                dataView[i] = dataString.charCodeAt(i);
            }
            return data;
        };
        /**
         * Converts Uint8Array to a string
         * @param aBytes
         */
        BrowserStringUtils.utf8ArrToString = function (aBytes) {
            var sView = "";
            for (var nPart = void 0, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
                nPart = aBytes[nIdx];
                sView += String.fromCharCode(nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
                    /* (nPart - 252 << 30) may be not so safe in ECMAScript! So...: */
                    (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                    : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
                        (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                        : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
                            (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                            : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
                                (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                                : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
                                    (nPart - 192 << 6) + aBytes[++nIdx] - 128
                                    : /* nPart < 127 ? */ /* one byte */
                                        nPart);
            }
            return sView;
        };
        return BrowserStringUtils;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Class which exposes APIs to encode plaintext to base64 encoded string. See here for implementation details:
     * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_JavaScript's_UTF-16_%3E_UTF-8_%3E_base64
     */
    var Base64Encode = /** @class */ (function () {
        function Base64Encode() {
        }
        /**
         * Returns URL Safe b64 encoded string from a plaintext string.
         * @param input
         */
        Base64Encode.prototype.urlEncode = function (input) {
            return encodeURIComponent(this.encode(input)
                .replace(/=/g, "")
                .replace(/\+/g, "-")
                .replace(/\//g, "_"));
        };
        /**
         * Returns URL Safe b64 encoded string from an int8Array.
         * @param inputArr
         */
        Base64Encode.prototype.urlEncodeArr = function (inputArr) {
            return this.base64EncArr(inputArr)
                .replace(/=/g, "")
                .replace(/\+/g, "-")
                .replace(/\//g, "_");
        };
        /**
         * Returns b64 encoded string from plaintext string.
         * @param input
         */
        Base64Encode.prototype.encode = function (input) {
            var inputUtf8Arr = BrowserStringUtils.stringToUtf8Arr(input);
            return this.base64EncArr(inputUtf8Arr);
        };
        /**
         * Base64 encode byte array
         * @param aBytes
         */
        Base64Encode.prototype.base64EncArr = function (aBytes) {
            var eqLen = (3 - (aBytes.length % 3)) % 3;
            var sB64Enc = "";
            for (var nMod3 = void 0, nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
                nMod3 = nIdx % 3;
                /* Uncomment the following line in order to split the output in lines 76-character long: */
                /*
                 *if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
                 */
                nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
                if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                    sB64Enc += String.fromCharCode(this.uint6ToB64(nUint24 >>> 18 & 63), this.uint6ToB64(nUint24 >>> 12 & 63), this.uint6ToB64(nUint24 >>> 6 & 63), this.uint6ToB64(nUint24 & 63));
                    nUint24 = 0;
                }
            }
            return eqLen === 0 ? sB64Enc : sB64Enc.substring(0, sB64Enc.length - eqLen) + (eqLen === 1 ? "=" : "==");
        };
        /**
         * Base64 string to array encoding helper
         * @param nUint6
         */
        Base64Encode.prototype.uint6ToB64 = function (nUint6) {
            return nUint6 < 26 ?
                nUint6 + 65
                : nUint6 < 52 ?
                    nUint6 + 71
                    : nUint6 < 62 ?
                        nUint6 - 4
                        : nUint6 === 62 ?
                            43
                            : nUint6 === 63 ?
                                47
                                :
                                    65;
        };
        return Base64Encode;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Class which exposes APIs to decode base64 strings to plaintext. See here for implementation details:
     * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_JavaScript's_UTF-16_%3E_UTF-8_%3E_base64
     */
    var Base64Decode = /** @class */ (function () {
        function Base64Decode() {
        }
        /**
         * Returns a URL-safe plaintext decoded string from b64 encoded input.
         * @param input
         */
        Base64Decode.prototype.decode = function (input) {
            var encodedString = input.replace(/-/g, "+").replace(/_/g, "/");
            switch (encodedString.length % 4) {
                case 0:
                    break;
                case 2:
                    encodedString += "==";
                    break;
                case 3:
                    encodedString += "=";
                    break;
                default:
                    throw new Error("Invalid base64 string");
            }
            var inputUtf8Arr = this.base64DecToArr(encodedString);
            return BrowserStringUtils.utf8ArrToString(inputUtf8Arr);
        };
        /**
         * Decodes base64 into Uint8Array
         * @param base64String
         * @param nBlockSize
         */
        Base64Decode.prototype.base64DecToArr = function (base64String, nBlockSize) {
            var sB64Enc = base64String.replace(/[^A-Za-z0-9\+\/]/g, "");
            var nInLen = sB64Enc.length;
            var nOutLen = nBlockSize ? Math.ceil((nInLen * 3 + 1 >>> 2) / nBlockSize) * nBlockSize : nInLen * 3 + 1 >>> 2;
            var aBytes = new Uint8Array(nOutLen);
            for (var nMod3 = void 0, nMod4 = void 0, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
                nMod4 = nInIdx & 3;
                nUint24 |= this.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
                if (nMod4 === 3 || nInLen - nInIdx === 1) {
                    for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                        aBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
                    }
                    nUint24 = 0;
                }
            }
            return aBytes;
        };
        /**
         * Base64 string to array decoding helper
         * @param charNum
         */
        Base64Decode.prototype.b64ToUint6 = function (charNum) {
            return charNum > 64 && charNum < 91 ?
                charNum - 65
                : charNum > 96 && charNum < 123 ?
                    charNum - 71
                    : charNum > 47 && charNum < 58 ?
                        charNum + 4
                        : charNum === 43 ?
                            62
                            : charNum === 47 ?
                                63
                                :
                                    0;
        };
        return Base64Decode;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
     */
    var BrowserAuthErrorMessage = {
        pkceNotGenerated: {
            code: "pkce_not_created",
            desc: "The PKCE code challenge and verifier could not be generated."
        },
        cryptoDoesNotExist: {
            code: "crypto_nonexistent",
            desc: "The crypto object or function is not available."
        },
        httpMethodNotImplementedError: {
            code: "http_method_not_implemented",
            desc: "The HTTP method given has not been implemented in this library."
        },
        emptyNavigateUriError: {
            code: "empty_navigate_uri",
            desc: "Navigation URI is empty. Please check stack trace for more info."
        },
        hashEmptyError: {
            code: "hash_empty_error",
            desc: "Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash."
        },
        hashDoesNotContainStateError: {
            code: "no_state_in_hash",
            desc: "Hash does not contain state. Please verify that the request originated from msal."
        },
        hashDoesNotContainKnownPropertiesError: {
            code: "hash_does_not_contain_known_properties",
            desc: "Hash does not contain known properites. Please verify that your redirectUri is not changing the hash."
        },
        unableToParseStateError: {
            code: "unable_to_parse_state",
            desc: "Unable to parse state. Please verify that the request originated from msal."
        },
        stateInteractionTypeMismatchError: {
            code: "state_interaction_type_mismatch",
            desc: "Hash contains state but the interaction type does not match the caller."
        },
        interactionInProgress: {
            code: "interaction_in_progress",
            desc: "Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.  For more visit: aka.ms/msaljs/browser-errors."
        },
        popUpWindowError: {
            code: "popup_window_error",
            desc: "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser."
        },
        emptyWindowError: {
            code: "empty_window_error",
            desc: "window.open returned null or undefined window object."
        },
        userCancelledError: {
            code: "user_cancelled",
            desc: "User cancelled the flow."
        },
        monitorPopupTimeoutError: {
            code: "monitor_window_timeout",
            desc: "Token acquisition in popup failed due to timeout. For more visit: aka.ms/msaljs/browser-errors."
        },
        monitorIframeTimeoutError: {
            code: "monitor_window_timeout",
            desc: "Token acquisition in iframe failed due to timeout. For more visit: aka.ms/msaljs/browser-errors."
        },
        redirectInIframeError: {
            code: "redirect_in_iframe",
            desc: "Code flow is not supported inside an iframe. Please ensure you are using MSAL.js in a top frame of the window if using the redirect APIs, or use the popup APIs."
        },
        blockTokenRequestsInHiddenIframeError: {
            code: "block_iframe_reload",
            desc: "Request was blocked inside an iframe because MSAL detected an authentication response. For more visit: aka.ms/msaljs/browser-errors"
        },
        blockAcquireTokenInPopupsError: {
            code: "block_nested_popups",
            desc: "Request was blocked inside a popup because MSAL detected it was running in a popup."
        },
        iframeClosedPrematurelyError: {
            code: "iframe_closed_prematurely",
            desc: "The iframe being monitored was closed prematurely."
        },
        silentSSOInsufficientInfoError: {
            code: "silent_sso_error",
            desc: "Silent SSO could not be completed - insufficient information was provided. Please provide either a loginHint or sid."
        },
        noAccountError: {
            code: "no_account_error",
            desc: "No account object provided to acquireTokenSilent and no active account has been set. Please call setActiveAccount or provide an account on the request."
        },
        silentPromptValueError: {
            code: "silent_prompt_value_error",
            desc: "The value given for the prompt value is not valid for silent requests - must be set to 'none'."
        },
        noTokenRequestCacheError: {
            code: "no_token_request_cache_error",
            desc: "No token request in found in cache."
        },
        unableToParseTokenRequestCacheError: {
            code: "unable_to_parse_token_request_cache_error",
            desc: "The cached token request could not be parsed."
        },
        noCachedAuthorityError: {
            code: "no_cached_authority_error",
            desc: "No cached authority found."
        },
        authRequestNotSet: {
            code: "auth_request_not_set_error",
            desc: "Auth Request not set. Please ensure initiateAuthRequest was called from the InteractionHandler"
        },
        invalidCacheType: {
            code: "invalid_cache_type",
            desc: "Invalid cache type"
        },
        notInBrowserEnvironment: {
            code: "non_browser_environment",
            desc: "Login and token requests are not supported in non-browser environments."
        },
        databaseNotOpen: {
            code: "database_not_open",
            desc: "Database is not open!"
        },
        noNetworkConnectivity: {
            code: "no_network_connectivity",
            desc: "No network connectivity. Check your internet connection."
        },
        postRequestFailed: {
            code: "post_request_failed",
            desc: "Network request failed: If the browser threw a CORS error, check that the redirectUri is registered in the Azure App Portal as type 'SPA'"
        },
        getRequestFailed: {
            code: "get_request_failed",
            desc: "Network request failed. Please check the network trace to determine root cause."
        },
        failedToParseNetworkResponse: {
            code: "failed_to_parse_response",
            desc: "Failed to parse network response. Check network trace."
        }
    };
    /**
     * Browser library error class thrown by the MSAL.js library for SPAs
     */
    var BrowserAuthError = /** @class */ (function (_super) {
        __extends$1(BrowserAuthError, _super);
        function BrowserAuthError(errorCode, errorMessage) {
            var _this = _super.call(this, errorCode, errorMessage) || this;
            Object.setPrototypeOf(_this, BrowserAuthError.prototype);
            _this.name = "BrowserAuthError";
            return _this;
        }
        /**
         * Creates an error thrown when PKCE is not implemented.
         * @param errDetail
         */
        BrowserAuthError.createPkceNotGeneratedError = function (errDetail) {
            return new BrowserAuthError(BrowserAuthErrorMessage.pkceNotGenerated.code, BrowserAuthErrorMessage.pkceNotGenerated.desc + " Detail:" + errDetail);
        };
        /**
         * Creates an error thrown when the crypto object is unavailable.
         * @param errDetail
         */
        BrowserAuthError.createCryptoNotAvailableError = function (errDetail) {
            return new BrowserAuthError(BrowserAuthErrorMessage.cryptoDoesNotExist.code, BrowserAuthErrorMessage.cryptoDoesNotExist.desc + " Detail:" + errDetail);
        };
        /**
         * Creates an error thrown when an HTTP method hasn't been implemented by the browser class.
         * @param method
         */
        BrowserAuthError.createHttpMethodNotImplementedError = function (method) {
            return new BrowserAuthError(BrowserAuthErrorMessage.httpMethodNotImplementedError.code, BrowserAuthErrorMessage.httpMethodNotImplementedError.desc + " Given Method: " + method);
        };
        /**
         * Creates an error thrown when the navigation URI is empty.
         */
        BrowserAuthError.createEmptyNavigationUriError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.emptyNavigateUriError.code, BrowserAuthErrorMessage.emptyNavigateUriError.desc);
        };
        /**
         * Creates an error thrown when the hash string value is unexpectedly empty.
         * @param hashValue
         */
        BrowserAuthError.createEmptyHashError = function (hashValue) {
            return new BrowserAuthError(BrowserAuthErrorMessage.hashEmptyError.code, BrowserAuthErrorMessage.hashEmptyError.desc + " Given Url: " + hashValue);
        };
        /**
         * Creates an error thrown when the hash string value is unexpectedly empty.
         */
        BrowserAuthError.createHashDoesNotContainStateError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.hashDoesNotContainStateError.code, BrowserAuthErrorMessage.hashDoesNotContainStateError.desc);
        };
        /**
         * Creates an error thrown when the hash string value does not contain known properties
         */
        BrowserAuthError.createHashDoesNotContainKnownPropertiesError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.hashDoesNotContainKnownPropertiesError.code, BrowserAuthErrorMessage.hashDoesNotContainKnownPropertiesError.desc);
        };
        /**
         * Creates an error thrown when the hash string value is unexpectedly empty.
         */
        BrowserAuthError.createUnableToParseStateError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.unableToParseStateError.code, BrowserAuthErrorMessage.unableToParseStateError.desc);
        };
        /**
         * Creates an error thrown when the state value in the hash does not match the interaction type of the API attempting to consume it.
         */
        BrowserAuthError.createStateInteractionTypeMismatchError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.stateInteractionTypeMismatchError.code, BrowserAuthErrorMessage.stateInteractionTypeMismatchError.desc);
        };
        /**
         * Creates an error thrown when a browser interaction (redirect or popup) is in progress.
         */
        BrowserAuthError.createInteractionInProgressError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.interactionInProgress.code, BrowserAuthErrorMessage.interactionInProgress.desc);
        };
        /**
         * Creates an error thrown when the popup window could not be opened.
         * @param errDetail
         */
        BrowserAuthError.createPopupWindowError = function (errDetail) {
            var errorMessage = BrowserAuthErrorMessage.popUpWindowError.desc;
            errorMessage = !StringUtils.isEmpty(errDetail) ? errorMessage + " Details: " + errDetail : errorMessage;
            return new BrowserAuthError(BrowserAuthErrorMessage.popUpWindowError.code, errorMessage);
        };
        /**
         * Creates an error thrown when window.open returns an empty window object.
         * @param errDetail
         */
        BrowserAuthError.createEmptyWindowCreatedError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.emptyWindowError.code, BrowserAuthErrorMessage.emptyWindowError.desc);
        };
        /**
         * Creates an error thrown when the user closes a popup.
         */
        BrowserAuthError.createUserCancelledError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.userCancelledError.code, BrowserAuthErrorMessage.userCancelledError.desc);
        };
        /**
         * Creates an error thrown when monitorPopupFromHash times out for a given popup.
         */
        BrowserAuthError.createMonitorPopupTimeoutError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.monitorPopupTimeoutError.code, BrowserAuthErrorMessage.monitorPopupTimeoutError.desc);
        };
        /**
         * Creates an error thrown when monitorIframeFromHash times out for a given iframe.
         */
        BrowserAuthError.createMonitorIframeTimeoutError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.monitorIframeTimeoutError.code, BrowserAuthErrorMessage.monitorIframeTimeoutError.desc);
        };
        /**
         * Creates an error thrown when navigateWindow is called inside an iframe.
         * @param windowParentCheck
         */
        BrowserAuthError.createRedirectInIframeError = function (windowParentCheck) {
            return new BrowserAuthError(BrowserAuthErrorMessage.redirectInIframeError.code, BrowserAuthErrorMessage.redirectInIframeError.desc + " (window.parent !== window) => " + windowParentCheck);
        };
        /**
         * Creates an error thrown when an auth reload is done inside an iframe.
         */
        BrowserAuthError.createBlockReloadInHiddenIframeError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.code, BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.desc);
        };
        /**
         * Creates an error thrown when a popup attempts to call an acquireToken API
         * @returns
         */
        BrowserAuthError.createBlockAcquireTokenInPopupsError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.code, BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.desc);
        };
        /**
         * Creates an error thrown when an iframe is found to be closed before the timeout is reached.
         */
        BrowserAuthError.createIframeClosedPrematurelyError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.iframeClosedPrematurelyError.code, BrowserAuthErrorMessage.iframeClosedPrematurelyError.desc);
        };
        /**
         * Creates an error thrown when the login_hint, sid or account object is not provided in the ssoSilent API.
         */
        BrowserAuthError.createSilentSSOInsufficientInfoError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.silentSSOInsufficientInfoError.code, BrowserAuthErrorMessage.silentSSOInsufficientInfoError.desc);
        };
        /**
         * Creates an error thrown when the account object is not provided in the acquireTokenSilent API.
         */
        BrowserAuthError.createNoAccountError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.noAccountError.code, BrowserAuthErrorMessage.noAccountError.desc);
        };
        /**
         * Creates an error thrown when a given prompt value is invalid for silent requests.
         */
        BrowserAuthError.createSilentPromptValueError = function (givenPrompt) {
            return new BrowserAuthError(BrowserAuthErrorMessage.silentPromptValueError.code, BrowserAuthErrorMessage.silentPromptValueError.desc + " Given value: " + givenPrompt);
        };
        /**
         * Creates an error thrown when the cached token request could not be retrieved from the cache
         */
        BrowserAuthError.createUnableToParseTokenRequestCacheError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.unableToParseTokenRequestCacheError.code, BrowserAuthErrorMessage.unableToParseTokenRequestCacheError.desc);
        };
        /**
         * Creates an error thrown when the token request could not be retrieved from the cache
         */
        BrowserAuthError.createNoTokenRequestCacheError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.noTokenRequestCacheError.code, BrowserAuthErrorMessage.noTokenRequestCacheError.desc);
        };
        /**
         * Creates an error thrown when handleCodeResponse is called before initiateAuthRequest (InteractionHandler)
         */
        BrowserAuthError.createAuthRequestNotSetError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.authRequestNotSet.code, BrowserAuthErrorMessage.authRequestNotSet.desc);
        };
        /**
         * Creates an error thrown when the authority could not be retrieved from the cache
         */
        BrowserAuthError.createNoCachedAuthorityError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.noCachedAuthorityError.code, BrowserAuthErrorMessage.noCachedAuthorityError.desc);
        };
        /**
         * Creates an error thrown if cache type is invalid.
         */
        BrowserAuthError.createInvalidCacheTypeError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.invalidCacheType.code, "" + BrowserAuthErrorMessage.invalidCacheType.desc);
        };
        /**
         * Create an error thrown when login and token requests are made from a non-browser environment
         */
        BrowserAuthError.createNonBrowserEnvironmentError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.notInBrowserEnvironment.code, BrowserAuthErrorMessage.notInBrowserEnvironment.desc);
        };
        /**
         * Create an error thrown when indexDB database is not open
         */
        BrowserAuthError.createDatabaseNotOpenError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.databaseNotOpen.code, BrowserAuthErrorMessage.databaseNotOpen.desc);
        };
        /**
         * Create an error thrown when token fetch fails due to no internet
         */
        BrowserAuthError.createNoNetworkConnectivityError = function () {
            return new BrowserAuthError(BrowserAuthErrorMessage.noNetworkConnectivity.code, BrowserAuthErrorMessage.noNetworkConnectivity.desc);
        };
        /**
         * Create an error thrown when token fetch fails due to reasons other than internet connectivity
         */
        BrowserAuthError.createPostRequestFailedError = function (errorDesc, endpoint) {
            return new BrowserAuthError(BrowserAuthErrorMessage.postRequestFailed.code, BrowserAuthErrorMessage.postRequestFailed.desc + " | Network client threw: " + errorDesc + " | Attempted to reach: " + endpoint.split("?")[0]);
        };
        /**
         * Create an error thrown when get request fails due to reasons other than internet connectivity
         */
        BrowserAuthError.createGetRequestFailedError = function (errorDesc, endpoint) {
            return new BrowserAuthError(BrowserAuthErrorMessage.getRequestFailed.code, BrowserAuthErrorMessage.getRequestFailed.desc + " | Network client threw: " + errorDesc + " | Attempted to reach: " + endpoint.split("?")[0]);
        };
        /**
         * Create an error thrown when network client fails to parse network response
         */
        BrowserAuthError.createFailedToParseNetworkResponseError = function (endpoint) {
            return new BrowserAuthError(BrowserAuthErrorMessage.failedToParseNetworkResponse.code, BrowserAuthErrorMessage.failedToParseNetworkResponse.desc + " | Attempted to reach: " + endpoint.split("?")[0]);
        };
        return BrowserAuthError;
    }(AuthError));

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    // Constant byte array length
    var RANDOM_BYTE_ARR_LENGTH = 32;
    /**
     * Class which exposes APIs to generate PKCE codes and code verifiers.
     */
    var PkceGenerator = /** @class */ (function () {
        function PkceGenerator(cryptoObj) {
            this.base64Encode = new Base64Encode();
            this.cryptoObj = cryptoObj;
        }
        /**
         * Generates PKCE Codes. See the RFC for more information: https://tools.ietf.org/html/rfc7636
         */
        PkceGenerator.prototype.generateCodes = function () {
            return __awaiter$1(this, void 0, void 0, function () {
                var codeVerifier, codeChallenge;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            codeVerifier = this.generateCodeVerifier();
                            return [4 /*yield*/, this.generateCodeChallengeFromVerifier(codeVerifier)];
                        case 1:
                            codeChallenge = _a.sent();
                            return [2 /*return*/, {
                                    verifier: codeVerifier,
                                    challenge: codeChallenge
                                }];
                    }
                });
            });
        };
        /**
         * Generates a random 32 byte buffer and returns the base64
         * encoded string to be used as a PKCE Code Verifier
         */
        PkceGenerator.prototype.generateCodeVerifier = function () {
            try {
                // Generate random values as utf-8
                var buffer = new Uint8Array(RANDOM_BYTE_ARR_LENGTH);
                this.cryptoObj.getRandomValues(buffer);
                // encode verifier as base64
                var pkceCodeVerifierB64 = this.base64Encode.urlEncodeArr(buffer);
                return pkceCodeVerifierB64;
            }
            catch (e) {
                throw BrowserAuthError.createPkceNotGeneratedError(e);
            }
        };
        /**
         * Creates a base64 encoded PKCE Code Challenge string from the
         * hash created from the PKCE Code Verifier supplied
         */
        PkceGenerator.prototype.generateCodeChallengeFromVerifier = function (pkceCodeVerifier) {
            return __awaiter$1(this, void 0, void 0, function () {
                var pkceHashedCodeVerifier, e_1;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.cryptoObj.sha256Digest(pkceCodeVerifier)];
                        case 1:
                            pkceHashedCodeVerifier = _a.sent();
                            // encode hash as base64
                            return [2 /*return*/, this.base64Encode.urlEncodeArr(new Uint8Array(pkceHashedCodeVerifier))];
                        case 2:
                            e_1 = _a.sent();
                            throw BrowserAuthError.createPkceNotGeneratedError(e_1);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return PkceGenerator;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * See here for more info on RsaHashedKeyGenParams: https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams
     */
    // RSA KeyGen Algorithm
    var PKCS1_V15_KEYGEN_ALG = "RSASSA-PKCS1-v1_5";
    // SHA-256 hashing algorithm
    var S256_HASH_ALG = "SHA-256";
    // MOD length for PoP tokens
    var MODULUS_LENGTH = 2048;
    // Public Exponent
    var PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);
    /**
     * This class implements functions used by the browser library to perform cryptography operations such as
     * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
     */
    var BrowserCrypto = /** @class */ (function () {
        function BrowserCrypto() {
            if (!(this.hasCryptoAPI())) {
                throw BrowserAuthError.createCryptoNotAvailableError("Browser crypto or msCrypto object not available.");
            }
            this._keygenAlgorithmOptions = {
                name: PKCS1_V15_KEYGEN_ALG,
                hash: S256_HASH_ALG,
                modulusLength: MODULUS_LENGTH,
                publicExponent: PUBLIC_EXPONENT
            };
        }
        /**
         * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
         * @param dataString
         */
        BrowserCrypto.prototype.sha256Digest = function (dataString) {
            return __awaiter$1(this, void 0, void 0, function () {
                var data;
                return __generator$1(this, function (_a) {
                    data = BrowserStringUtils.stringToUtf8Arr(dataString);
                    return [2 /*return*/, this.hasIECrypto() ? this.getMSCryptoDigest(S256_HASH_ALG, data) : this.getSubtleCryptoDigest(S256_HASH_ALG, data)];
                });
            });
        };
        /**
         * Populates buffer with cryptographically random values.
         * @param dataBuffer
         */
        BrowserCrypto.prototype.getRandomValues = function (dataBuffer) {
            var cryptoObj = window["msCrypto"] || window.crypto;
            if (!cryptoObj.getRandomValues) {
                throw BrowserAuthError.createCryptoNotAvailableError("getRandomValues does not exist.");
            }
            cryptoObj.getRandomValues(dataBuffer);
        };
        /**
         * Generates a keypair based on current keygen algorithm config.
         * @param extractable
         * @param usages
         */
        BrowserCrypto.prototype.generateKeyPair = function (extractable, usages) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, (this.hasIECrypto() ?
                            this.msCryptoGenerateKey(extractable, usages)
                            : window.crypto.subtle.generateKey(this._keygenAlgorithmOptions, extractable, usages))];
                });
            });
        };
        /**
         * Export key as Json Web Key (JWK)
         * @param key
         * @param format
         */
        BrowserCrypto.prototype.exportJwk = function (key) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, this.hasIECrypto() ? this.msCryptoExportJwk(key) : window.crypto.subtle.exportKey(KEY_FORMAT_JWK, key)];
                });
            });
        };
        /**
         * Imports key as Json Web Key (JWK), can set extractable and usages.
         * @param key
         * @param format
         * @param extractable
         * @param usages
         */
        BrowserCrypto.prototype.importJwk = function (key, extractable, usages) {
            return __awaiter$1(this, void 0, void 0, function () {
                var keyString, keyBuffer;
                return __generator$1(this, function (_a) {
                    keyString = BrowserCrypto.getJwkString(key);
                    keyBuffer = BrowserStringUtils.stringToArrayBuffer(keyString);
                    return [2 /*return*/, this.hasIECrypto() ?
                            this.msCryptoImportKey(keyBuffer, extractable, usages)
                            : window.crypto.subtle.importKey(KEY_FORMAT_JWK, key, this._keygenAlgorithmOptions, extractable, usages)];
                });
            });
        };
        /**
         * Signs given data with given key
         * @param key
         * @param data
         */
        BrowserCrypto.prototype.sign = function (key, data) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, this.hasIECrypto() ?
                            this.msCryptoSign(key, data)
                            : window.crypto.subtle.sign(this._keygenAlgorithmOptions, key, data)];
                });
            });
        };
        /**
         * Check whether IE crypto or other browser cryptography is available.
         */
        BrowserCrypto.prototype.hasCryptoAPI = function () {
            return this.hasIECrypto() || this.hasBrowserCrypto();
        };
        /**
         * Checks whether IE crypto (AKA msCrypto) is available.
         */
        BrowserCrypto.prototype.hasIECrypto = function () {
            return "msCrypto" in window;
        };
        /**
         * Check whether browser crypto is available.
         */
        BrowserCrypto.prototype.hasBrowserCrypto = function () {
            return "crypto" in window;
        };
        /**
         * Helper function for SHA digest.
         * @param algorithm
         * @param data
         */
        BrowserCrypto.prototype.getSubtleCryptoDigest = function (algorithm, data) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, window.crypto.subtle.digest(algorithm, data)];
                });
            });
        };
        /**
         * IE Helper function for SHA digest.
         * @param algorithm
         * @param data
         */
        BrowserCrypto.prototype.getMSCryptoDigest = function (algorithm, data) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var digestOperation = window["msCrypto"].subtle.digest(algorithm, data.buffer);
                            digestOperation.addEventListener("complete", function (e) {
                                resolve(e.target.result);
                            });
                            digestOperation.addEventListener("error", function (error) {
                                reject(error);
                            });
                        })];
                });
            });
        };
        /**
         * IE Helper function for generating a keypair
         * @param extractable
         * @param usages
         */
        BrowserCrypto.prototype.msCryptoGenerateKey = function (extractable, usages) {
            return __awaiter$1(this, void 0, void 0, function () {
                var _this = this;
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var msGenerateKey = window["msCrypto"].subtle.generateKey(_this._keygenAlgorithmOptions, extractable, usages);
                            msGenerateKey.addEventListener("complete", function (e) {
                                resolve(e.target.result);
                            });
                            msGenerateKey.addEventListener("error", function (error) {
                                reject(error);
                            });
                        })];
                });
            });
        };
        /**
         * IE Helper function for exportKey
         * @param key
         * @param format
         */
        BrowserCrypto.prototype.msCryptoExportJwk = function (key) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var msExportKey = window["msCrypto"].subtle.exportKey(KEY_FORMAT_JWK, key);
                            msExportKey.addEventListener("complete", function (e) {
                                var resultBuffer = e.target.result;
                                var resultString = BrowserStringUtils.utf8ArrToString(new Uint8Array(resultBuffer))
                                    .replace(/\r/g, "")
                                    .replace(/\n/g, "")
                                    .replace(/\t/g, "")
                                    .split(" ").join("")
                                    .replace("\u0000", "");
                                try {
                                    resolve(JSON.parse(resultString));
                                }
                                catch (e) {
                                    reject(e);
                                }
                            });
                            msExportKey.addEventListener("error", function (error) {
                                reject(error);
                            });
                        })];
                });
            });
        };
        /**
         * IE Helper function for importKey
         * @param key
         * @param format
         * @param extractable
         * @param usages
         */
        BrowserCrypto.prototype.msCryptoImportKey = function (keyBuffer, extractable, usages) {
            return __awaiter$1(this, void 0, void 0, function () {
                var _this = this;
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var msImportKey = window["msCrypto"].subtle.importKey(KEY_FORMAT_JWK, keyBuffer, _this._keygenAlgorithmOptions, extractable, usages);
                            msImportKey.addEventListener("complete", function (e) {
                                resolve(e.target.result);
                            });
                            msImportKey.addEventListener("error", function (error) {
                                reject(error);
                            });
                        })];
                });
            });
        };
        /**
         * IE Helper function for sign JWT
         * @param key
         * @param data
         */
        BrowserCrypto.prototype.msCryptoSign = function (key, data) {
            return __awaiter$1(this, void 0, void 0, function () {
                var _this = this;
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var msSign = window["msCrypto"].subtle.sign(_this._keygenAlgorithmOptions, key, data);
                            msSign.addEventListener("complete", function (e) {
                                resolve(e.target.result);
                            });
                            msSign.addEventListener("error", function (error) {
                                reject(error);
                            });
                        })];
                });
            });
        };
        /**
         * Returns stringified jwk.
         * @param jwk
         */
        BrowserCrypto.getJwkString = function (jwk) {
            return JSON.stringify(jwk, Object.keys(jwk).sort());
        };
        return BrowserCrypto;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Storage wrapper for IndexedDB storage in browsers: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
     */
    var DatabaseStorage = /** @class */ (function () {
        function DatabaseStorage(dbName, tableName, version) {
            this.dbName = dbName;
            this.tableName = tableName;
            this.version = version;
            this.dbOpen = false;
        }
        /**
         * Opens IndexedDB instance.
         */
        DatabaseStorage.prototype.open = function () {
            return __awaiter$1(this, void 0, void 0, function () {
                var _this = this;
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            // TODO: Add timeouts?
                            var openDB = window.indexedDB.open(_this.dbName, _this.version);
                            openDB.addEventListener("upgradeneeded", function (e) {
                                var event = e;
                                event.target.result.createObjectStore(_this.tableName);
                            });
                            openDB.addEventListener("success", function (e) {
                                var event = e;
                                _this.db = event.target.result;
                                _this.dbOpen = true;
                                resolve();
                            });
                            openDB.addEventListener("error", function (error) { return reject(error); });
                        })];
                });
            });
        };
        /**
         * Retrieves item from IndexedDB instance.
         * @param key
         */
        DatabaseStorage.prototype.get = function (key) {
            return __awaiter$1(this, void 0, void 0, function () {
                var _this = this;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!this.dbOpen) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.open()];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, new Promise(function (resolve, reject) {
                                // TODO: Add timeouts?
                                if (!_this.db) {
                                    return reject(BrowserAuthError.createDatabaseNotOpenError());
                                }
                                var transaction = _this.db.transaction([_this.tableName], "readonly");
                                var objectStore = transaction.objectStore(_this.tableName);
                                var dbGet = objectStore.get(key);
                                dbGet.addEventListener("success", function (e) {
                                    var event = e;
                                    resolve(event.target.result);
                                });
                                dbGet.addEventListener("error", function (e) { return reject(e); });
                            })];
                    }
                });
            });
        };
        /**
         * Adds item to IndexedDB under given key
         * @param key
         * @param payload
         */
        DatabaseStorage.prototype.put = function (key, payload) {
            return __awaiter$1(this, void 0, void 0, function () {
                var _this = this;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!this.dbOpen) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.open()];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, new Promise(function (resolve, reject) {
                                // TODO: Add timeouts?
                                if (!_this.db) {
                                    return reject(BrowserAuthError.createDatabaseNotOpenError());
                                }
                                var transaction = _this.db.transaction([_this.tableName], "readwrite");
                                var objectStore = transaction.objectStore(_this.tableName);
                                var dbPut = objectStore.put(payload, key);
                                dbPut.addEventListener("success", function (e) {
                                    var event = e;
                                    resolve(event.target.result);
                                });
                                dbPut.addEventListener("error", function (e) { return reject(e); });
                            })];
                    }
                });
            });
        };
        return DatabaseStorage;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * This class implements MSAL's crypto interface, which allows it to perform base64 encoding and decoding, generating cryptographically random GUIDs and
     * implementing Proof Key for Code Exchange specs for the OAuth Authorization Code Flow using PKCE (rfc here: https://tools.ietf.org/html/rfc7636).
     */
    var CryptoOps = /** @class */ (function () {
        function CryptoOps() {
            // Browser crypto needs to be validated first before any other classes can be set.
            this.browserCrypto = new BrowserCrypto();
            this.b64Encode = new Base64Encode();
            this.b64Decode = new Base64Decode();
            this.guidGenerator = new GuidGenerator(this.browserCrypto);
            this.pkceGenerator = new PkceGenerator(this.browserCrypto);
            this.cache = new DatabaseStorage(CryptoOps.DB_NAME, CryptoOps.TABLE_NAME, CryptoOps.DB_VERSION);
        }
        /**
         * Creates a new random GUID - used to populate state and nonce.
         * @returns string (GUID)
         */
        CryptoOps.prototype.createNewGuid = function () {
            return this.guidGenerator.generateGuid();
        };
        /**
         * Encodes input string to base64.
         * @param input
         */
        CryptoOps.prototype.base64Encode = function (input) {
            return this.b64Encode.encode(input);
        };
        /**
         * Decodes input string from base64.
         * @param input
         */
        CryptoOps.prototype.base64Decode = function (input) {
            return this.b64Decode.decode(input);
        };
        /**
         * Generates PKCE codes used in Authorization Code Flow.
         */
        CryptoOps.prototype.generatePkceCodes = function () {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, this.pkceGenerator.generateCodes()];
                });
            });
        };
        /**
         * Generates a keypair, stores it and returns a thumbprint
         * @param request
         */
        CryptoOps.prototype.getPublicKeyThumbprint = function (request) {
            return __awaiter$1(this, void 0, void 0, function () {
                var keyPair, publicKeyJwk, pubKeyThumprintObj, publicJwkString, publicJwkBuffer, publicJwkHash, privateKeyJwk, unextractablePrivateKey;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.browserCrypto.generateKeyPair(CryptoOps.EXTRACTABLE, CryptoOps.POP_KEY_USAGES)];
                        case 1:
                            keyPair = _a.sent();
                            return [4 /*yield*/, this.browserCrypto.exportJwk(keyPair.publicKey)];
                        case 2:
                            publicKeyJwk = _a.sent();
                            pubKeyThumprintObj = {
                                e: publicKeyJwk.e,
                                kty: publicKeyJwk.kty,
                                n: publicKeyJwk.n
                            };
                            publicJwkString = BrowserCrypto.getJwkString(pubKeyThumprintObj);
                            return [4 /*yield*/, this.browserCrypto.sha256Digest(publicJwkString)];
                        case 3:
                            publicJwkBuffer = _a.sent();
                            publicJwkHash = this.b64Encode.urlEncodeArr(new Uint8Array(publicJwkBuffer));
                            return [4 /*yield*/, this.browserCrypto.exportJwk(keyPair.privateKey)];
                        case 4:
                            privateKeyJwk = _a.sent();
                            return [4 /*yield*/, this.browserCrypto.importJwk(privateKeyJwk, false, ["sign"])];
                        case 5:
                            unextractablePrivateKey = _a.sent();
                            // Store Keypair data in keystore
                            this.cache.put(publicJwkHash, {
                                privateKey: unextractablePrivateKey,
                                publicKey: keyPair.publicKey,
                                requestMethod: request.resourceRequestMethod,
                                requestUri: request.resourceRequestUri
                            });
                            return [2 /*return*/, publicJwkHash];
                    }
                });
            });
        };
        /**
         * Signs the given object as a jwt payload with private key retrieved by given kid.
         * @param payload
         * @param kid
         */
        CryptoOps.prototype.signJwt = function (payload, kid) {
            return __awaiter$1(this, void 0, void 0, function () {
                var cachedKeyPair, publicKeyJwk, publicKeyJwkString, header, encodedHeader, encodedPayload, tokenString, tokenBuffer, signatureBuffer, encodedSignature;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.cache.get(kid)];
                        case 1:
                            cachedKeyPair = _a.sent();
                            return [4 /*yield*/, this.browserCrypto.exportJwk(cachedKeyPair.publicKey)];
                        case 2:
                            publicKeyJwk = _a.sent();
                            publicKeyJwkString = BrowserCrypto.getJwkString(publicKeyJwk);
                            header = {
                                alg: publicKeyJwk.alg,
                                type: KEY_FORMAT_JWK
                            };
                            encodedHeader = this.b64Encode.urlEncode(JSON.stringify(header));
                            // Generate payload
                            payload.cnf = {
                                jwk: JSON.parse(publicKeyJwkString)
                            };
                            encodedPayload = this.b64Encode.urlEncode(JSON.stringify(payload));
                            tokenString = encodedHeader + "." + encodedPayload;
                            tokenBuffer = BrowserStringUtils.stringToArrayBuffer(tokenString);
                            return [4 /*yield*/, this.browserCrypto.sign(cachedKeyPair.privateKey, tokenBuffer)];
                        case 3:
                            signatureBuffer = _a.sent();
                            encodedSignature = this.b64Encode.urlEncodeArr(new Uint8Array(signatureBuffer));
                            return [2 /*return*/, tokenString + "." + encodedSignature];
                    }
                });
            });
        };
        CryptoOps.POP_KEY_USAGES = ["sign", "verify"];
        CryptoOps.EXTRACTABLE = true;
        CryptoOps.DB_VERSION = 1;
        CryptoOps.DB_NAME = "msal.db";
        CryptoOps.TABLE_NAME = CryptoOps.DB_NAME + ".keys";
        return CryptoOps;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
     */
    var BrowserConfigurationAuthErrorMessage = {
        redirectUriNotSet: {
            code: "redirect_uri_empty",
            desc: "A redirect URI is required for all calls, and none has been set."
        },
        postLogoutUriNotSet: {
            code: "post_logout_uri_empty",
            desc: "A post logout redirect has not been set."
        },
        storageNotSupportedError: {
            code: "storage_not_supported",
            desc: "Given storage configuration option was not supported."
        },
        noRedirectCallbacksSet: {
            code: "no_redirect_callbacks",
            desc: "No redirect callbacks have been set. Please call setRedirectCallbacks() with the appropriate function arguments before continuing. " +
                "More information is available here: https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/MSAL-basics."
        },
        invalidCallbackObject: {
            code: "invalid_callback_object",
            desc: "The object passed for the callback was invalid. " +
                "More information is available here: https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/MSAL-basics."
        },
        stubPcaInstanceCalled: {
            code: "stubbed_public_client_application_called",
            desc: "Stub instance of Public Client Application was called. If using msal-react, please ensure context is not used without a provider. For more visit: aka.ms/msaljs/browser-errors"
        },
        inMemRedirectUnavailable: {
            code: "in_mem_redirect_unavailable",
            desc: "Redirect cannot be supported. In-memory storage was selected and storeAuthStateInCookie=false, which would cause the library to be unable to handle the incoming hash. If you would like to use the redirect API, please use session/localStorage or set storeAuthStateInCookie=true."
        }
    };
    /**
     * Browser library error class thrown by the MSAL.js library for SPAs
     */
    var BrowserConfigurationAuthError = /** @class */ (function (_super) {
        __extends$1(BrowserConfigurationAuthError, _super);
        function BrowserConfigurationAuthError(errorCode, errorMessage) {
            var _this = _super.call(this, errorCode, errorMessage) || this;
            _this.name = "BrowserConfigurationAuthError";
            Object.setPrototypeOf(_this, BrowserConfigurationAuthError.prototype);
            return _this;
        }
        /**
         * Creates an error thrown when the redirect uri is empty (not set by caller)
         */
        BrowserConfigurationAuthError.createRedirectUriEmptyError = function () {
            return new BrowserConfigurationAuthError(BrowserConfigurationAuthErrorMessage.redirectUriNotSet.code, BrowserConfigurationAuthErrorMessage.redirectUriNotSet.desc);
        };
        /**
         * Creates an error thrown when the post-logout redirect uri is empty (not set by caller)
         */
        BrowserConfigurationAuthError.createPostLogoutRedirectUriEmptyError = function () {
            return new BrowserConfigurationAuthError(BrowserConfigurationAuthErrorMessage.postLogoutUriNotSet.code, BrowserConfigurationAuthErrorMessage.postLogoutUriNotSet.desc);
        };
        /**
         * Creates error thrown when given storage location is not supported.
         * @param givenStorageLocation
         */
        BrowserConfigurationAuthError.createStorageNotSupportedError = function (givenStorageLocation) {
            return new BrowserConfigurationAuthError(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.code, BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc + " Given Location: " + givenStorageLocation);
        };
        /**
         * Creates error thrown when redirect callbacks are not set before calling loginRedirect() or acquireTokenRedirect().
         */
        BrowserConfigurationAuthError.createRedirectCallbacksNotSetError = function () {
            return new BrowserConfigurationAuthError(BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.code, BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.desc);
        };
        /**
         * Creates error thrown when the stub instance of PublicClientApplication is called.
         */
        BrowserConfigurationAuthError.createStubPcaInstanceCalledError = function () {
            return new BrowserConfigurationAuthError(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code, BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
        };
        /*
         * Create an error thrown when in-memory storage is used and storeAuthStateInCookie=false.
         */
        BrowserConfigurationAuthError.createInMemoryRedirectUnavailableError = function () {
            return new BrowserConfigurationAuthError(BrowserConfigurationAuthErrorMessage.inMemRedirectUnavailable.code, BrowserConfigurationAuthErrorMessage.inMemRedirectUnavailable.desc);
        };
        return BrowserConfigurationAuthError;
    }(AuthError));

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var BrowserStorage = /** @class */ (function () {
        function BrowserStorage(cacheLocation) {
            this.validateWindowStorage(cacheLocation);
            this.windowStorage = window[cacheLocation];
        }
        BrowserStorage.prototype.validateWindowStorage = function (cacheLocation) {
            if (cacheLocation !== BrowserCacheLocation.LocalStorage && cacheLocation !== BrowserCacheLocation.SessionStorage) {
                throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
            }
            var storageSupported = !!window[cacheLocation];
            if (!storageSupported) {
                throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
            }
        };
        BrowserStorage.prototype.getItem = function (key) {
            return this.windowStorage.getItem(key);
        };
        BrowserStorage.prototype.setItem = function (key, value) {
            this.windowStorage.setItem(key, value);
        };
        BrowserStorage.prototype.removeItem = function (key) {
            this.windowStorage.removeItem(key);
        };
        BrowserStorage.prototype.getKeys = function () {
            return Object.keys(this.windowStorage);
        };
        BrowserStorage.prototype.containsKey = function (key) {
            return this.windowStorage.hasOwnProperty(key);
        };
        return BrowserStorage;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var MemoryStorage = /** @class */ (function () {
        function MemoryStorage() {
            this.cache = new Map();
        }
        MemoryStorage.prototype.getItem = function (key) {
            return this.cache.get(key) || null;
        };
        MemoryStorage.prototype.setItem = function (key, value) {
            this.cache.set(key, value);
        };
        MemoryStorage.prototype.removeItem = function (key) {
            this.cache.delete(key);
        };
        MemoryStorage.prototype.getKeys = function () {
            var cacheKeys = [];
            this.cache.forEach(function (value, key) {
                cacheKeys.push(key);
            });
            return cacheKeys;
        };
        MemoryStorage.prototype.containsKey = function (key) {
            return this.cache.has(key);
        };
        MemoryStorage.prototype.clear = function () {
            this.cache.clear();
        };
        return MemoryStorage;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var BrowserProtocolUtils = /** @class */ (function () {
        function BrowserProtocolUtils() {
        }
        /**
         * Extracts the BrowserStateObject from the state string.
         * @param browserCrypto
         * @param state
         */
        BrowserProtocolUtils.extractBrowserRequestState = function (browserCrypto, state) {
            if (StringUtils.isEmpty(state)) {
                return null;
            }
            try {
                var requestStateObj = ProtocolUtils.parseRequestState(browserCrypto, state);
                return requestStateObj.libraryState.meta;
            }
            catch (e) {
                throw ClientAuthError.createInvalidStateError(state, e);
            }
        };
        /**
         * Parses properties of server response from url hash
         * @param locationHash Hash from url
         */
        BrowserProtocolUtils.parseServerResponseFromHash = function (locationHash) {
            if (!locationHash) {
                return {};
            }
            var hashUrlString = new UrlString(locationHash);
            return UrlString.getDeserializedHash(hashUrlString.getHash());
        };
        return BrowserProtocolUtils;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * This class implements the cache storage interface for MSAL through browser local or session storage.
     * Cookies are only used if storeAuthStateInCookie is true, and are only used for
     * parameters such as state and nonce, generally.
     */
    var BrowserCacheManager = /** @class */ (function (_super) {
        __extends$1(BrowserCacheManager, _super);
        function BrowserCacheManager(clientId, cacheConfig, cryptoImpl, logger) {
            var _this = _super.call(this, clientId, cryptoImpl) || this;
            // Cookie life calculation (hours * minutes * seconds * ms)
            _this.COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;
            _this.cacheConfig = cacheConfig;
            _this.logger = logger;
            _this.internalStorage = new MemoryStorage();
            _this.browserStorage = _this.setupBrowserStorage(_this.cacheConfig.cacheLocation);
            _this.temporaryCacheStorage = _this.setupTemporaryCacheStorage(_this.cacheConfig.cacheLocation);
            // Migrate any cache entries from older versions of MSAL.
            _this.migrateCacheEntries();
            return _this;
        }
        /**
         * Returns a window storage class implementing the IWindowStorage interface that corresponds to the configured cacheLocation.
         * @param cacheLocation
         */
        BrowserCacheManager.prototype.setupBrowserStorage = function (cacheLocation) {
            switch (cacheLocation) {
                case BrowserCacheLocation.LocalStorage:
                case BrowserCacheLocation.SessionStorage:
                    try {
                        // Temporary cache items will always be stored in session storage to mitigate problems caused by multiple tabs
                        return new BrowserStorage(cacheLocation);
                    }
                    catch (e) {
                        this.logger.verbose(e);
                        break;
                    }
            }
            this.cacheConfig.cacheLocation = BrowserCacheLocation.MemoryStorage;
            return new MemoryStorage();
        };
        /**
         *
         * @param cacheLocation
         */
        BrowserCacheManager.prototype.setupTemporaryCacheStorage = function (cacheLocation) {
            switch (cacheLocation) {
                case BrowserCacheLocation.LocalStorage:
                case BrowserCacheLocation.SessionStorage:
                    try {
                        // Temporary cache items will always be stored in session storage to mitigate problems caused by multiple tabs
                        return new BrowserStorage(BrowserCacheLocation.SessionStorage);
                    }
                    catch (e) {
                        this.logger.verbose(e);
                        return this.internalStorage;
                    }
                case BrowserCacheLocation.MemoryStorage:
                default:
                    return this.internalStorage;
            }
        };
        /**
         * Migrate all old cache entries to new schema. No rollback supported.
         * @param storeAuthStateInCookie
         */
        BrowserCacheManager.prototype.migrateCacheEntries = function () {
            var _this = this;
            var idTokenKey = Constants.CACHE_PREFIX + "." + PersistentCacheKeys.ID_TOKEN;
            var clientInfoKey = Constants.CACHE_PREFIX + "." + PersistentCacheKeys.CLIENT_INFO;
            var errorKey = Constants.CACHE_PREFIX + "." + PersistentCacheKeys.ERROR;
            var errorDescKey = Constants.CACHE_PREFIX + "." + PersistentCacheKeys.ERROR_DESC;
            var idTokenValue = this.browserStorage.getItem(idTokenKey);
            var clientInfoValue = this.browserStorage.getItem(clientInfoKey);
            var errorValue = this.browserStorage.getItem(errorKey);
            var errorDescValue = this.browserStorage.getItem(errorDescKey);
            var values = [idTokenValue, clientInfoValue, errorValue, errorDescValue];
            var keysToMigrate = [PersistentCacheKeys.ID_TOKEN, PersistentCacheKeys.CLIENT_INFO, PersistentCacheKeys.ERROR, PersistentCacheKeys.ERROR_DESC];
            keysToMigrate.forEach(function (cacheKey, index) { return _this.migrateCacheEntry(cacheKey, values[index]); });
        };
        /**
         * Utility function to help with migration.
         * @param newKey
         * @param value
         * @param storeAuthStateInCookie
         */
        BrowserCacheManager.prototype.migrateCacheEntry = function (newKey, value) {
            if (value) {
                this.setTemporaryCache(newKey, value, true);
            }
        };
        /**
         * Parses passed value as JSON object, JSON.parse() will throw an error.
         * @param input
         */
        BrowserCacheManager.prototype.validateAndParseJson = function (jsonValue) {
            try {
                var parsedJson = JSON.parse(jsonValue);
                /**
                 * There are edge cases in which JSON.parse will successfully parse a non-valid JSON object
                 * (e.g. JSON.parse will parse an escaped string into an unescaped string), so adding a type check
                 * of the parsed value is necessary in order to be certain that the string represents a valid JSON object.
                 *
                 */
                return (parsedJson && typeof parsedJson === "object") ? parsedJson : null;
            }
            catch (error) {
                return null;
            }
        };
        /**
         * fetches the entry from the browser storage based off the key
         * @param key
         */
        BrowserCacheManager.prototype.getItem = function (key) {
            return this.browserStorage.getItem(key);
        };
        /**
         * sets the entry in the browser storage
         * @param key
         * @param value
         */
        BrowserCacheManager.prototype.setItem = function (key, value) {
            this.browserStorage.setItem(key, value);
        };
        /**
         * fetch the account entity from the platform cache
         * @param accountKey
         */
        BrowserCacheManager.prototype.getAccount = function (accountKey) {
            var account = this.getItem(accountKey);
            if (!account) {
                return null;
            }
            var parsedAccount = this.validateAndParseJson(account);
            if (!parsedAccount || !AccountEntity.isAccountEntity(parsedAccount)) {
                return null;
            }
            return CacheManager.toObject(new AccountEntity(), parsedAccount);
        };
        /**
         * set account entity in the platform cache
         * @param key
         * @param value
         */
        BrowserCacheManager.prototype.setAccount = function (account) {
            this.logger.trace("BrowserCacheManager.setAccount called");
            var key = account.generateAccountKey();
            this.setItem(key, JSON.stringify(account));
        };
        /**
         * generates idToken entity from a string
         * @param idTokenKey
         */
        BrowserCacheManager.prototype.getIdTokenCredential = function (idTokenKey) {
            var value = this.getItem(idTokenKey);
            if (!value) {
                this.logger.trace("BrowserCacheManager.getIdTokenCredential: called, no cache hit");
                return null;
            }
            var parsedIdToken = this.validateAndParseJson(value);
            if (!parsedIdToken || !IdTokenEntity.isIdTokenEntity(parsedIdToken)) {
                this.logger.trace("BrowserCacheManager.getIdTokenCredential: called, no cache hit");
                return null;
            }
            this.logger.trace("BrowserCacheManager.getIdTokenCredential: cache hit");
            return CacheManager.toObject(new IdTokenEntity(), parsedIdToken);
        };
        /**
         * set IdToken credential to the platform cache
         * @param idToken
         */
        BrowserCacheManager.prototype.setIdTokenCredential = function (idToken) {
            this.logger.trace("BrowserCacheManager.setIdTokenCredential called");
            var idTokenKey = idToken.generateCredentialKey();
            this.setItem(idTokenKey, JSON.stringify(idToken));
        };
        /**
         * generates accessToken entity from a string
         * @param key
         */
        BrowserCacheManager.prototype.getAccessTokenCredential = function (accessTokenKey) {
            var value = this.getItem(accessTokenKey);
            if (!value) {
                this.logger.trace("BrowserCacheManager.getAccessTokenCredential: called, no cache hit");
                return null;
            }
            var parsedAccessToken = this.validateAndParseJson(value);
            if (!parsedAccessToken || !AccessTokenEntity.isAccessTokenEntity(parsedAccessToken)) {
                this.logger.trace("BrowserCacheManager.getAccessTokenCredential: called, no cache hit");
                return null;
            }
            this.logger.trace("BrowserCacheManager.getAccessTokenCredential: cache hit");
            return CacheManager.toObject(new AccessTokenEntity(), parsedAccessToken);
        };
        /**
         * set accessToken credential to the platform cache
         * @param accessToken
         */
        BrowserCacheManager.prototype.setAccessTokenCredential = function (accessToken) {
            this.logger.trace("BrowserCacheManager.setAccessTokenCredential called");
            var accessTokenKey = accessToken.generateCredentialKey();
            this.setItem(accessTokenKey, JSON.stringify(accessToken));
        };
        /**
         * generates refreshToken entity from a string
         * @param refreshTokenKey
         */
        BrowserCacheManager.prototype.getRefreshTokenCredential = function (refreshTokenKey) {
            var value = this.getItem(refreshTokenKey);
            if (!value) {
                this.logger.trace("BrowserCacheManager.getRefreshTokenCredential: called, no cache hit");
                return null;
            }
            var parsedRefreshToken = this.validateAndParseJson(value);
            if (!parsedRefreshToken || !RefreshTokenEntity.isRefreshTokenEntity(parsedRefreshToken)) {
                this.logger.trace("BrowserCacheManager.getRefreshTokenCredential: called, no cache hit");
                return null;
            }
            this.logger.trace("BrowserCacheManager.getRefreshTokenCredential: cache hit");
            return CacheManager.toObject(new RefreshTokenEntity(), parsedRefreshToken);
        };
        /**
         * set refreshToken credential to the platform cache
         * @param refreshToken
         */
        BrowserCacheManager.prototype.setRefreshTokenCredential = function (refreshToken) {
            this.logger.trace("BrowserCacheManager.setRefreshTokenCredential called");
            var refreshTokenKey = refreshToken.generateCredentialKey();
            this.setItem(refreshTokenKey, JSON.stringify(refreshToken));
        };
        /**
         * fetch appMetadata entity from the platform cache
         * @param appMetadataKey
         */
        BrowserCacheManager.prototype.getAppMetadata = function (appMetadataKey) {
            var value = this.getItem(appMetadataKey);
            if (!value) {
                this.logger.trace("BrowserCacheManager.getAppMetadata: called, no cache hit");
                return null;
            }
            var parsedMetadata = this.validateAndParseJson(value);
            if (!parsedMetadata || !AppMetadataEntity.isAppMetadataEntity(appMetadataKey, parsedMetadata)) {
                this.logger.trace("BrowserCacheManager.getAppMetadata: called, no cache hit");
                return null;
            }
            this.logger.trace("BrowserCacheManager.getAppMetadata: cache hit");
            return CacheManager.toObject(new AppMetadataEntity(), parsedMetadata);
        };
        /**
         * set appMetadata entity to the platform cache
         * @param appMetadata
         */
        BrowserCacheManager.prototype.setAppMetadata = function (appMetadata) {
            this.logger.trace("BrowserCacheManager.setAppMetadata called");
            var appMetadataKey = appMetadata.generateAppMetadataKey();
            this.setItem(appMetadataKey, JSON.stringify(appMetadata));
        };
        /**
         * fetch server telemetry entity from the platform cache
         * @param serverTelemetryKey
         */
        BrowserCacheManager.prototype.getServerTelemetry = function (serverTelemetryKey) {
            var value = this.getItem(serverTelemetryKey);
            if (!value) {
                this.logger.trace("BrowserCacheManager.getServerTelemetry: called, no cache hit");
                return null;
            }
            var parsedMetadata = this.validateAndParseJson(value);
            if (!parsedMetadata || !ServerTelemetryEntity.isServerTelemetryEntity(serverTelemetryKey, parsedMetadata)) {
                this.logger.trace("BrowserCacheManager.getServerTelemetry: called, no cache hit");
                return null;
            }
            this.logger.trace("BrowserCacheManager.getServerTelemetry: cache hit");
            return CacheManager.toObject(new ServerTelemetryEntity(), parsedMetadata);
        };
        /**
         * set server telemetry entity to the platform cache
         * @param serverTelemetryKey
         * @param serverTelemetry
         */
        BrowserCacheManager.prototype.setServerTelemetry = function (serverTelemetryKey, serverTelemetry) {
            this.logger.trace("BrowserCacheManager.setServerTelemetry called");
            this.setItem(serverTelemetryKey, JSON.stringify(serverTelemetry));
        };
        /**
         *
         */
        BrowserCacheManager.prototype.getAuthorityMetadata = function (key) {
            var value = this.internalStorage.getItem(key);
            if (!value) {
                this.logger.trace("BrowserCacheManager.getAuthorityMetadata: called, no cache hit");
                return null;
            }
            var parsedMetadata = this.validateAndParseJson(value);
            if (parsedMetadata && AuthorityMetadataEntity.isAuthorityMetadataEntity(key, parsedMetadata)) {
                this.logger.trace("BrowserCacheManager.getAuthorityMetadata: cache hit");
                return CacheManager.toObject(new AuthorityMetadataEntity(), parsedMetadata);
            }
            return null;
        };
        /**
         *
         */
        BrowserCacheManager.prototype.getAuthorityMetadataKeys = function () {
            var _this = this;
            var allKeys = this.internalStorage.getKeys();
            return allKeys.filter(function (key) {
                return _this.isAuthorityMetadata(key);
            });
        };
        /**
         *
         * @param entity
         */
        BrowserCacheManager.prototype.setAuthorityMetadata = function (key, entity) {
            this.logger.trace("BrowserCacheManager.setAuthorityMetadata called");
            this.internalStorage.setItem(key, JSON.stringify(entity));
        };
        /**
         * fetch throttling entity from the platform cache
         * @param throttlingCacheKey
         */
        BrowserCacheManager.prototype.getThrottlingCache = function (throttlingCacheKey) {
            var value = this.getItem(throttlingCacheKey);
            if (!value) {
                this.logger.trace("BrowserCacheManager.getThrottlingCache: called, no cache hit");
                return null;
            }
            var parsedThrottlingCache = this.validateAndParseJson(value);
            if (!parsedThrottlingCache || !ThrottlingEntity.isThrottlingEntity(throttlingCacheKey, parsedThrottlingCache)) {
                this.logger.trace("BrowserCacheManager.getThrottlingCache: called, no cache hit");
                return null;
            }
            this.logger.trace("BrowserCacheManager.getThrottlingCache: cache hit");
            return CacheManager.toObject(new ThrottlingEntity(), parsedThrottlingCache);
        };
        /**
         * set throttling entity to the platform cache
         * @param throttlingCacheKey
         * @param throttlingCache
         */
        BrowserCacheManager.prototype.setThrottlingCache = function (throttlingCacheKey, throttlingCache) {
            this.logger.trace("BrowserCacheManager.setThrottlingCache called");
            this.setItem(throttlingCacheKey, JSON.stringify(throttlingCache));
        };
        /**
         * Gets cache item with given key.
         * Will retrieve from cookies if storeAuthStateInCookie is set to true.
         * @param key
         */
        BrowserCacheManager.prototype.getTemporaryCache = function (cacheKey, generateKey) {
            var key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;
            if (this.cacheConfig.storeAuthStateInCookie) {
                var itemCookie = this.getItemCookie(key);
                if (itemCookie) {
                    this.logger.trace("BrowserCacheManager.getTemporaryCache: storeAuthStateInCookies set to true, retrieving from cookies");
                    return itemCookie;
                }
            }
            var value = this.temporaryCacheStorage.getItem(key);
            if (!value) {
                // If temp cache item not found in session/memory, check local storage for items set by old versions
                if (this.cacheConfig.cacheLocation === BrowserCacheLocation.LocalStorage) {
                    var item = this.browserStorage.getItem(key);
                    if (item) {
                        this.logger.trace("BrowserCacheManager.getTemporaryCache: Temporary cache item found in local storage");
                        return item;
                    }
                }
                this.logger.trace("BrowserCacheManager.getTemporaryCache: No cache item found in local storage");
                return null;
            }
            this.logger.trace("BrowserCacheManager.getTemporaryCache: Temporary cache item returned");
            return value;
        };
        /**
         * Sets the cache item with the key and value given.
         * Stores in cookie if storeAuthStateInCookie is set to true.
         * This can cause cookie overflow if used incorrectly.
         * @param key
         * @param value
         */
        BrowserCacheManager.prototype.setTemporaryCache = function (cacheKey, value, generateKey) {
            var key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;
            this.temporaryCacheStorage.setItem(key, value);
            if (this.cacheConfig.storeAuthStateInCookie) {
                this.logger.trace("BrowserCacheManager.setTemporaryCache: storeAuthStateInCookie set to true, setting item cookie");
                this.setItemCookie(key, value);
            }
        };
        /**
         * Removes the cache item with the given key.
         * Will also clear the cookie item if storeAuthStateInCookie is set to true.
         * @param key
         */
        BrowserCacheManager.prototype.removeItem = function (key) {
            this.browserStorage.removeItem(key);
            this.temporaryCacheStorage.removeItem(key);
            if (this.cacheConfig.storeAuthStateInCookie) {
                this.logger.trace("BrowserCacheManager.removeItem: storeAuthStateInCookie is true, clearing item cookie");
                this.clearItemCookie(key);
            }
            return true;
        };
        /**
         * Checks whether key is in cache.
         * @param key
         */
        BrowserCacheManager.prototype.containsKey = function (key) {
            return this.browserStorage.containsKey(key) || this.temporaryCacheStorage.containsKey(key);
        };
        /**
         * Gets all keys in window.
         */
        BrowserCacheManager.prototype.getKeys = function () {
            return __spread(this.browserStorage.getKeys(), this.temporaryCacheStorage.getKeys());
        };
        /**
         * Clears all cache entries created by MSAL (except tokens).
         */
        BrowserCacheManager.prototype.clear = function () {
            var _this = this;
            this.removeAllAccounts();
            this.removeAppMetadata();
            this.getKeys().forEach(function (cacheKey) {
                // Check if key contains msal prefix; For now, we are clearing all the cache items created by MSAL.js
                if ((_this.browserStorage.containsKey(cacheKey) || _this.temporaryCacheStorage.containsKey(cacheKey)) && ((cacheKey.indexOf(Constants.CACHE_PREFIX) !== -1) || (cacheKey.indexOf(_this.clientId) !== -1))) {
                    _this.removeItem(cacheKey);
                }
            });
            this.internalStorage.clear();
        };
        /**
         * Add value to cookies
         * @param cookieName
         * @param cookieValue
         * @param expires
         */
        BrowserCacheManager.prototype.setItemCookie = function (cookieName, cookieValue, expires) {
            var cookieStr = encodeURIComponent(cookieName) + "=" + encodeURIComponent(cookieValue) + ";path=/;";
            if (expires) {
                var expireTime = this.getCookieExpirationTime(expires);
                cookieStr += "expires=" + expireTime + ";";
            }
            if (this.cacheConfig.secureCookies) {
                cookieStr += "Secure;";
            }
            document.cookie = cookieStr;
        };
        /**
         * Get one item by key from cookies
         * @param cookieName
         */
        BrowserCacheManager.prototype.getItemCookie = function (cookieName) {
            var name = encodeURIComponent(cookieName) + "=";
            var cookieList = document.cookie.split(";");
            for (var i = 0; i < cookieList.length; i++) {
                var cookie = cookieList[i];
                while (cookie.charAt(0) === " ") {
                    cookie = cookie.substring(1);
                }
                if (cookie.indexOf(name) === 0) {
                    return decodeURIComponent(cookie.substring(name.length, cookie.length));
                }
            }
            return "";
        };
        /**
         * Clear all msal-related cookies currently set in the browser. Should only be used to clear temporary cache items.
         */
        BrowserCacheManager.prototype.clearMsalCookies = function () {
            var _this = this;
            var cookiePrefix = Constants.CACHE_PREFIX + "." + this.clientId;
            var cookieList = document.cookie.split(";");
            cookieList.forEach(function (cookie) {
                while (cookie.charAt(0) === " ") {
                    // eslint-disable-next-line no-param-reassign
                    cookie = cookie.substring(1);
                }
                if (cookie.indexOf(cookiePrefix) === 0) {
                    var cookieKey = cookie.split("=")[0];
                    _this.clearItemCookie(cookieKey);
                }
            });
        };
        /**
         * Clear an item in the cookies by key
         * @param cookieName
         */
        BrowserCacheManager.prototype.clearItemCookie = function (cookieName) {
            this.setItemCookie(cookieName, "", -1);
        };
        /**
         * Get cookie expiration time
         * @param cookieLifeDays
         */
        BrowserCacheManager.prototype.getCookieExpirationTime = function (cookieLifeDays) {
            var today = new Date();
            var expr = new Date(today.getTime() + cookieLifeDays * this.COOKIE_LIFE_MULTIPLIER);
            return expr.toUTCString();
        };
        /**
         * Gets the cache object referenced by the browser
         */
        BrowserCacheManager.prototype.getCache = function () {
            return this.browserStorage;
        };
        /**
         * interface compat, we cannot overwrite browser cache; Functionality is supported by individual entities in browser
         */
        BrowserCacheManager.prototype.setCache = function () {
            // sets nothing
        };
        /**
         * Prepend msal.<client-id> to each key; Skip for any JSON object as Key (defined schemas do not need the key appended: AccessToken Keys or the upcoming schema)
         * @param key
         * @param addInstanceId
         */
        BrowserCacheManager.prototype.generateCacheKey = function (key) {
            var generatedKey = this.validateAndParseJson(key);
            if (!generatedKey) {
                if (StringUtils.startsWith(key, Constants.CACHE_PREFIX) || StringUtils.startsWith(key, PersistentCacheKeys.ADAL_ID_TOKEN)) {
                    return key;
                }
                return Constants.CACHE_PREFIX + "." + this.clientId + "." + key;
            }
            return JSON.stringify(key);
        };
        /**
         * Create authorityKey to cache authority
         * @param state
         */
        BrowserCacheManager.prototype.generateAuthorityKey = function (stateString) {
            var stateId = ProtocolUtils.parseRequestState(this.cryptoImpl, stateString).libraryState.id;
            return this.generateCacheKey(TemporaryCacheKeys.AUTHORITY + "." + stateId);
        };
        /**
         * Create Nonce key to cache nonce
         * @param state
         */
        BrowserCacheManager.prototype.generateNonceKey = function (stateString) {
            var stateId = ProtocolUtils.parseRequestState(this.cryptoImpl, stateString).libraryState.id;
            return this.generateCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN + "." + stateId);
        };
        /**
         * Creates full cache key for the request state
         * @param stateString State string for the request
         */
        BrowserCacheManager.prototype.generateStateKey = function (stateString) {
            // Use the library state id to key temp storage for uniqueness for multiple concurrent requests
            var stateId = ProtocolUtils.parseRequestState(this.cryptoImpl, stateString).libraryState.id;
            return this.generateCacheKey(TemporaryCacheKeys.REQUEST_STATE + "." + stateId);
        };
        /**
         * Gets the cached authority based on the cached state. Returns empty if no cached state found.
         */
        BrowserCacheManager.prototype.getCachedAuthority = function (cachedState) {
            var stateCacheKey = this.generateStateKey(cachedState);
            var state = this.getTemporaryCache(stateCacheKey);
            if (!state) {
                return null;
            }
            var authorityCacheKey = this.generateAuthorityKey(state);
            return this.getTemporaryCache(authorityCacheKey);
        };
        /**
         * Updates account, authority, and state in cache
         * @param serverAuthenticationRequest
         * @param account
         */
        BrowserCacheManager.prototype.updateCacheEntries = function (state, nonce, authorityInstance, loginHint, account) {
            this.logger.trace("BrowserCacheManager.updateCacheEntries called");
            // Cache the request state
            var stateCacheKey = this.generateStateKey(state);
            this.setTemporaryCache(stateCacheKey, state, false);
            // Cache the nonce
            var nonceCacheKey = this.generateNonceKey(state);
            this.setTemporaryCache(nonceCacheKey, nonce, false);
            // Cache authorityKey
            var authorityCacheKey = this.generateAuthorityKey(state);
            this.setTemporaryCache(authorityCacheKey, authorityInstance, false);
            if (account) {
                var ccsCredential = {
                    credential: account.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID
                };
                this.setTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, JSON.stringify(ccsCredential), true);
            }
            else if (!StringUtils.isEmpty(loginHint)) {
                var ccsCredential = {
                    credential: loginHint,
                    type: CcsCredentialType.UPN
                };
                this.setTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, JSON.stringify(ccsCredential), true);
            }
        };
        /**
         * Reset all temporary cache items
         * @param state
         */
        BrowserCacheManager.prototype.resetRequestCache = function (state) {
            var _this = this;
            this.logger.trace("BrowserCacheManager.resetRequestCache called");
            // check state and remove associated cache items
            if (!StringUtils.isEmpty(state)) {
                this.getKeys().forEach(function (key) {
                    if (key.indexOf(state) !== -1) {
                        _this.removeItem(key);
                    }
                });
            }
            // delete generic interactive request parameters
            if (state) {
                this.removeItem(this.generateStateKey(state));
                this.removeItem(this.generateNonceKey(state));
                this.removeItem(this.generateAuthorityKey(state));
            }
            this.removeItem(this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS));
            this.removeItem(this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI));
            this.removeItem(this.generateCacheKey(TemporaryCacheKeys.URL_HASH));
            this.removeItem(this.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
            this.removeItem(this.generateCacheKey(TemporaryCacheKeys.CCS_CREDENTIAL));
        };
        /**
         * Removes temporary cache for the provided state
         * @param stateString
         */
        BrowserCacheManager.prototype.cleanRequestByState = function (stateString) {
            this.logger.trace("BrowserCacheManager.cleanRequestByState called");
            // Interaction is completed - remove interaction status.
            if (stateString) {
                var stateKey = this.generateStateKey(stateString);
                var cachedState = this.temporaryCacheStorage.getItem(stateKey);
                this.logger.infoPii("BrowserCacheManager.cleanRequestByState: Removing temporary cache items for state: " + cachedState);
                this.resetRequestCache(cachedState || "");
            }
            this.clearMsalCookies();
        };
        /**
         * Looks in temporary cache for any state values with the provided interactionType and removes all temporary cache items for that state
         * Used in scenarios where temp cache needs to be cleaned but state is not known, such as clicking browser back button.
         * @param interactionType
         */
        BrowserCacheManager.prototype.cleanRequestByInteractionType = function (interactionType) {
            var _this = this;
            this.logger.trace("BrowserCacheManager.cleanRequestByInteractionType called");
            // Loop through all keys to find state key
            this.getKeys().forEach(function (key) {
                // If this key is not the state key, move on
                if (key.indexOf(TemporaryCacheKeys.REQUEST_STATE) === -1) {
                    return;
                }
                // Retrieve state value, return if not a valid value
                var stateValue = _this.temporaryCacheStorage.getItem(key);
                if (!stateValue) {
                    return;
                }
                // Extract state and ensure it matches given InteractionType, then clean request cache
                var parsedState = BrowserProtocolUtils.extractBrowserRequestState(_this.cryptoImpl, stateValue);
                if (parsedState && parsedState.interactionType === interactionType) {
                    _this.logger.infoPii("BrowserCacheManager.cleanRequestByInteractionType: Removing temporary cache items for state: " + stateValue);
                    _this.resetRequestCache(stateValue);
                }
            });
            this.clearMsalCookies();
        };
        BrowserCacheManager.prototype.cacheCodeRequest = function (authCodeRequest, browserCrypto) {
            this.logger.trace("BrowserCacheManager.cacheCodeRequest called");
            var encodedValue = browserCrypto.base64Encode(JSON.stringify(authCodeRequest));
            this.setTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, encodedValue, true);
        };
        /**
         * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
         */
        BrowserCacheManager.prototype.getCachedRequest = function (state, browserCrypto) {
            this.logger.trace("BrowserCacheManager.getCachedRequest called");
            // Get token request from cache and parse as TokenExchangeParameters.
            var encodedTokenRequest = this.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true);
            if (!encodedTokenRequest) {
                throw BrowserAuthError.createNoTokenRequestCacheError();
            }
            var parsedRequest = this.validateAndParseJson(browserCrypto.base64Decode(encodedTokenRequest));
            if (!parsedRequest) {
                throw BrowserAuthError.createUnableToParseTokenRequestCacheError();
            }
            this.removeItem(this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS));
            // Get cached authority and use if no authority is cached with request.
            if (StringUtils.isEmpty(parsedRequest.authority)) {
                var authorityCacheKey = this.generateAuthorityKey(state);
                var cachedAuthority = this.getTemporaryCache(authorityCacheKey);
                if (!cachedAuthority) {
                    throw BrowserAuthError.createNoCachedAuthorityError();
                }
                parsedRequest.authority = cachedAuthority;
            }
            return parsedRequest;
        };
        return BrowserCacheManager;
    }(CacheManager));
    var DEFAULT_BROWSER_CACHE_MANAGER = function (clientId, logger) {
        var cacheOptions = {
            cacheLocation: BrowserCacheLocation.MemoryStorage,
            storeAuthStateInCookie: false,
            secureCookies: false
        };
        return new BrowserCacheManager(clientId, cacheOptions, DEFAULT_CRYPTO_IMPLEMENTATION, logger);
    };

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * This class implements the Fetch API for GET and POST requests. See more here: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
     */
    var FetchClient = /** @class */ (function () {
        function FetchClient() {
        }
        /**
         * Fetch Client for REST endpoints - Get request
         * @param url
         * @param headers
         * @param body
         */
        FetchClient.prototype.sendGetRequestAsync = function (url, options) {
            return __awaiter$1(this, void 0, void 0, function () {
                var response, e_1, _a;
                return __generator$1(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, fetch(url, {
                                    method: HTTP_REQUEST_TYPE.GET,
                                    headers: this.getFetchHeaders(options)
                                })];
                        case 1:
                            response = _b.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _b.sent();
                            if (window.navigator.onLine) {
                                throw BrowserAuthError.createGetRequestFailedError(e_1, url);
                            }
                            else {
                                throw BrowserAuthError.createNoNetworkConnectivityError();
                            }
                        case 3:
                            _b.trys.push([3, 5, , 6]);
                            _a = {
                                headers: this.getHeaderDict(response.headers)
                            };
                            return [4 /*yield*/, response.json()];
                        case 4: return [2 /*return*/, (_a.body = (_b.sent()),
                                _a.status = response.status,
                                _a)];
                        case 5:
                            _b.sent();
                            throw BrowserAuthError.createFailedToParseNetworkResponseError(url);
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Fetch Client for REST endpoints - Post request
         * @param url
         * @param headers
         * @param body
         */
        FetchClient.prototype.sendPostRequestAsync = function (url, options) {
            return __awaiter$1(this, void 0, void 0, function () {
                var reqBody, response, e_3, _a;
                return __generator$1(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            reqBody = (options && options.body) || "";
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, fetch(url, {
                                    method: HTTP_REQUEST_TYPE.POST,
                                    headers: this.getFetchHeaders(options),
                                    body: reqBody
                                })];
                        case 2:
                            response = _b.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_3 = _b.sent();
                            if (window.navigator.onLine) {
                                throw BrowserAuthError.createPostRequestFailedError(e_3, url);
                            }
                            else {
                                throw BrowserAuthError.createNoNetworkConnectivityError();
                            }
                        case 4:
                            _b.trys.push([4, 6, , 7]);
                            _a = {
                                headers: this.getHeaderDict(response.headers)
                            };
                            return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, (_a.body = (_b.sent()),
                                _a.status = response.status,
                                _a)];
                        case 6:
                            _b.sent();
                            throw BrowserAuthError.createFailedToParseNetworkResponseError(url);
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get Fetch API Headers object from string map
         * @param inputHeaders
         */
        FetchClient.prototype.getFetchHeaders = function (options) {
            var headers = new Headers();
            if (!(options && options.headers)) {
                return headers;
            }
            var optionsHeaders = options.headers;
            Object.keys(optionsHeaders).forEach(function (key) {
                headers.append(key, optionsHeaders[key]);
            });
            return headers;
        };
        FetchClient.prototype.getHeaderDict = function (headers) {
            var headerDict = {};
            headers.forEach(function (value, key) {
                headerDict[key] = value;
            });
            return headerDict;
        };
        return FetchClient;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * This client implements the XMLHttpRequest class to send GET and POST requests.
     */
    var XhrClient = /** @class */ (function () {
        function XhrClient() {
        }
        /**
         * XhrClient for REST endpoints - Get request
         * @param url
         * @param headers
         * @param body
         */
        XhrClient.prototype.sendGetRequestAsync = function (url, options) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, this.sendRequestAsync(url, HTTP_REQUEST_TYPE.GET, options)];
                });
            });
        };
        /**
         * XhrClient for REST endpoints - Post request
         * @param url
         * @param headers
         * @param body
         */
        XhrClient.prototype.sendPostRequestAsync = function (url, options) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    return [2 /*return*/, this.sendRequestAsync(url, HTTP_REQUEST_TYPE.POST, options)];
                });
            });
        };
        /**
         * Helper for XhrClient requests.
         * @param url
         * @param method
         * @param options
         */
        XhrClient.prototype.sendRequestAsync = function (url, method, options) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url, /* async: */ true);
                _this.setXhrHeaders(xhr, options);
                xhr.onload = function () {
                    if (xhr.status < 200 || xhr.status >= 300) {
                        if (method === HTTP_REQUEST_TYPE.POST) {
                            reject(BrowserAuthError.createPostRequestFailedError("Failed with status " + xhr.status, url));
                        }
                        else {
                            reject(BrowserAuthError.createGetRequestFailedError("Failed with status " + xhr.status, url));
                        }
                    }
                    try {
                        var jsonResponse = JSON.parse(xhr.responseText);
                        var networkResponse = {
                            headers: _this.getHeaderDict(xhr),
                            body: jsonResponse,
                            status: xhr.status
                        };
                        resolve(networkResponse);
                    }
                    catch (e) {
                        reject(BrowserAuthError.createFailedToParseNetworkResponseError(url));
                    }
                };
                xhr.onerror = function () {
                    if (window.navigator.onLine) {
                        if (method === HTTP_REQUEST_TYPE.POST) {
                            reject(BrowserAuthError.createPostRequestFailedError("Failed with status " + xhr.status, url));
                        }
                        else {
                            reject(BrowserAuthError.createGetRequestFailedError("Failed with status " + xhr.status, url));
                        }
                    }
                    else {
                        reject(BrowserAuthError.createNoNetworkConnectivityError());
                    }
                };
                if (method === HTTP_REQUEST_TYPE.POST && options && options.body) {
                    xhr.send(options.body);
                }
                else if (method === HTTP_REQUEST_TYPE.GET) {
                    xhr.send();
                }
                else {
                    throw BrowserAuthError.createHttpMethodNotImplementedError(method);
                }
            });
        };
        /**
         * Helper to set XHR headers for request.
         * @param xhr
         * @param options
         */
        XhrClient.prototype.setXhrHeaders = function (xhr, options) {
            if (options && options.headers) {
                var headers_1 = options.headers;
                Object.keys(headers_1).forEach(function (key) {
                    xhr.setRequestHeader(key, headers_1[key]);
                });
            }
        };
        /**
         * Gets a string map of the headers received in the response.
         *
         * Algorithm comes from https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getAllResponseHeaders
         * @param xhr
         */
        XhrClient.prototype.getHeaderDict = function (xhr) {
            var headerString = xhr.getAllResponseHeaders();
            var headerArr = headerString.trim().split(/[\r\n]+/);
            var headerDict = {};
            headerArr.forEach(function (value) {
                var parts = value.split(": ");
                var headerName = parts.shift();
                var headerVal = parts.join(": ");
                if (headerName && headerVal) {
                    headerDict[headerName] = headerVal;
                }
            });
            return headerDict;
        };
        return XhrClient;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Utility class for browser specific functions
     */
    var BrowserUtils = /** @class */ (function () {
        function BrowserUtils() {
        }
        // #region Window Navigation and URL management
        /**
         * Clears hash from window url.
         */
        BrowserUtils.clearHash = function (contentWindow) {
            // Office.js sets history.replaceState to null
            contentWindow.location.hash = Constants.EMPTY_STRING;
            if (typeof contentWindow.history.replaceState === "function") {
                // Full removes "#" from url
                contentWindow.history.replaceState(null, Constants.EMPTY_STRING, "" + contentWindow.location.pathname + contentWindow.location.search);
            }
        };
        /**
         * Replaces current hash with hash from provided url
         */
        BrowserUtils.replaceHash = function (url) {
            var urlParts = url.split("#");
            urlParts.shift(); // Remove part before the hash
            window.location.hash = urlParts.length > 0 ? urlParts.join("#") : "";
        };
        /**
         * Returns boolean of whether the current window is in an iframe or not.
         */
        BrowserUtils.isInIframe = function () {
            return window.parent !== window;
        };
        // #endregion
        /**
         * Returns current window URL as redirect uri
         */
        BrowserUtils.getCurrentUri = function () {
            return window.location.href.split("?")[0].split("#")[0];
        };
        /**
         * Gets the homepage url for the current window location.
         */
        BrowserUtils.getHomepage = function () {
            var currentUrl = new UrlString(window.location.href);
            var urlComponents = currentUrl.getUrlComponents();
            return urlComponents.Protocol + "//" + urlComponents.HostNameAndPort + "/";
        };
        /**
         * Returns best compatible network client object.
         */
        BrowserUtils.getBrowserNetworkClient = function () {
            if (window.fetch && window.Headers) {
                return new FetchClient();
            }
            else {
                return new XhrClient();
            }
        };
        /**
         * Throws error if we have completed an auth and are
         * attempting another auth request inside an iframe.
         */
        BrowserUtils.blockReloadInHiddenIframes = function () {
            var isResponseHash = UrlString.hashContainsKnownProperties(window.location.hash);
            // return an error if called from the hidden iframe created by the msal js silent calls
            if (isResponseHash && BrowserUtils.isInIframe()) {
                throw BrowserAuthError.createBlockReloadInHiddenIframeError();
            }
        };
        /**
         * Block redirect operations in iframes unless explicitly allowed
         * @param interactionType Interaction type for the request
         * @param allowRedirectInIframe Config value to allow redirects when app is inside an iframe
         */
        BrowserUtils.blockRedirectInIframe = function (interactionType, allowRedirectInIframe) {
            var isIframedApp = BrowserUtils.isInIframe();
            if (interactionType === InteractionType.Redirect && isIframedApp && !allowRedirectInIframe) {
                // If we are not in top frame, we shouldn't redirect. This is also handled by the service.
                throw BrowserAuthError.createRedirectInIframeError(isIframedApp);
            }
        };
        /**
         * Block redirectUri loaded in popup from calling AcquireToken APIs
         */
        BrowserUtils.blockAcquireTokenInPopups = function () {
            // Popups opened by msal popup APIs are given a name that starts with "msal."
            if (window.opener && window.opener !== window && typeof window.name === "string" && window.name.indexOf(BrowserConstants.POPUP_NAME_PREFIX + ".") === 0) {
                throw BrowserAuthError.createBlockAcquireTokenInPopupsError();
            }
        };
        /**
         * Throws error if token requests are made in non-browser environment
         * @param isBrowserEnvironment Flag indicating if environment is a browser.
         */
        BrowserUtils.blockNonBrowserEnvironment = function (isBrowserEnvironment) {
            if (!isBrowserEnvironment) {
                throw BrowserAuthError.createNonBrowserEnvironmentError();
            }
        };
        /**
         * Returns boolean of whether current browser is an Internet Explorer or Edge browser.
         */
        BrowserUtils.detectIEOrEdge = function () {
            var ua = window.navigator.userAgent;
            var msie = ua.indexOf("MSIE ");
            var msie11 = ua.indexOf("Trident/");
            var msedge = ua.indexOf("Edge/");
            var isIE = msie > 0 || msie11 > 0;
            var isEdge = msedge > 0;
            return isIE || isEdge;
        };
        return BrowserUtils;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var NavigationClient = /** @class */ (function () {
        function NavigationClient() {
        }
        /**
         * Navigates to other pages within the same web application
         * @param url
         * @param options
         */
        NavigationClient.prototype.navigateInternal = function (url, options) {
            return NavigationClient.defaultNavigateWindow(url, options);
        };
        /**
         * Navigates to other pages outside the web application i.e. the Identity Provider
         * @param url
         * @param options
         */
        NavigationClient.prototype.navigateExternal = function (url, options) {
            return NavigationClient.defaultNavigateWindow(url, options);
        };
        /**
         * Default navigation implementation invoked by the internal and external functions
         * @param url
         * @param options
         */
        NavigationClient.defaultNavigateWindow = function (url, options) {
            if (options.noHistory) {
                window.location.replace(url);
            }
            else {
                window.location.assign(url);
            }
            return new Promise(function (resolve) {
                setTimeout(function () {
                    resolve(true);
                }, options.timeout);
            });
        };
        return NavigationClient;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    // Default timeout for popup windows and iframes in milliseconds
    var DEFAULT_POPUP_TIMEOUT_MS = 60000;
    var DEFAULT_IFRAME_TIMEOUT_MS = 6000;
    var DEFAULT_REDIRECT_TIMEOUT_MS = 30000;
    /**
     * MSAL function that sets the default options when not explicitly configured from app developer
     *
     * @param auth
     * @param cache
     * @param system
     *
     * @returns Configuration object
     */
    function buildConfiguration(_a, isBrowserEnvironment) {
        var userInputAuth = _a.auth, userInputCache = _a.cache, userInputSystem = _a.system;
        // Default auth options for browser
        var DEFAULT_AUTH_OPTIONS = {
            clientId: "",
            authority: "" + Constants.DEFAULT_AUTHORITY,
            knownAuthorities: [],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
            redirectUri: "",
            postLogoutRedirectUri: "",
            navigateToLoginRequestUrl: true,
            clientCapabilities: [],
            protocolMode: ProtocolMode.AAD
        };
        // Default cache options for browser
        var DEFAULT_CACHE_OPTIONS = {
            cacheLocation: BrowserCacheLocation.SessionStorage,
            storeAuthStateInCookie: false,
            secureCookies: false
        };
        // Default logger options for browser
        var DEFAULT_LOGGER_OPTIONS = {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            loggerCallback: function () { },
            logLevel: LogLevel.Info,
            piiLoggingEnabled: false
        };
        // Default system options for browser
        var DEFAULT_BROWSER_SYSTEM_OPTIONS = __assign$1(__assign$1({}, DEFAULT_SYSTEM_OPTIONS), { loggerOptions: DEFAULT_LOGGER_OPTIONS, networkClient: isBrowserEnvironment ? BrowserUtils.getBrowserNetworkClient() : StubbedNetworkModule, navigationClient: new NavigationClient(), loadFrameTimeout: 0, 
            // If loadFrameTimeout is provided, use that as default.
            windowHashTimeout: (userInputSystem && userInputSystem.loadFrameTimeout) || DEFAULT_POPUP_TIMEOUT_MS, iframeHashTimeout: (userInputSystem && userInputSystem.loadFrameTimeout) || DEFAULT_IFRAME_TIMEOUT_MS, navigateFrameWait: isBrowserEnvironment && BrowserUtils.detectIEOrEdge() ? 500 : 0, redirectNavigationTimeout: DEFAULT_REDIRECT_TIMEOUT_MS, asyncPopups: false, allowRedirectInIframe: false });
        var overlayedConfig = {
            auth: __assign$1(__assign$1({}, DEFAULT_AUTH_OPTIONS), userInputAuth),
            cache: __assign$1(__assign$1({}, DEFAULT_CACHE_OPTIONS), userInputCache),
            system: __assign$1(__assign$1({}, DEFAULT_BROWSER_SYSTEM_OPTIONS), userInputSystem)
        };
        return overlayedConfig;
    }

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * Abstract class which defines operations for a browser interaction handling class.
     */
    var InteractionHandler = /** @class */ (function () {
        function InteractionHandler(authCodeModule, storageImpl, authCodeRequest, browserRequestLogger) {
            this.authModule = authCodeModule;
            this.browserStorage = storageImpl;
            this.authCodeRequest = authCodeRequest;
            this.browserRequestLogger = browserRequestLogger;
        }
        /**
         * Function to handle response parameters from hash.
         * @param locationHash
         */
        InteractionHandler.prototype.handleCodeResponse = function (locationHash, state, authority, networkModule) {
            return __awaiter$1(this, void 0, void 0, function () {
                var stateKey, requestState, authCodeResponse, nonceKey, cachedNonce, cachedCcsCred, tokenResponse;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.browserRequestLogger.verbose("InteractionHandler.handleCodeResponse called");
                            // Check that location hash isn't empty.
                            if (StringUtils.isEmpty(locationHash)) {
                                throw BrowserAuthError.createEmptyHashError(locationHash);
                            }
                            stateKey = this.browserStorage.generateStateKey(state);
                            requestState = this.browserStorage.getTemporaryCache(stateKey);
                            if (!requestState) {
                                throw ClientAuthError.createStateNotFoundError("Cached State");
                            }
                            authCodeResponse = this.authModule.handleFragmentResponse(locationHash, requestState);
                            nonceKey = this.browserStorage.generateNonceKey(requestState);
                            cachedNonce = this.browserStorage.getTemporaryCache(nonceKey);
                            // Assign code to request
                            this.authCodeRequest.code = authCodeResponse.code;
                            if (!authCodeResponse.cloud_instance_host_name) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.updateTokenEndpointAuthority(authCodeResponse.cloud_instance_host_name, authority, networkModule)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            authCodeResponse.nonce = cachedNonce || undefined;
                            authCodeResponse.state = requestState;
                            // Add CCS parameters if available
                            if (authCodeResponse.client_info) {
                                this.authCodeRequest.clientInfo = authCodeResponse.client_info;
                            }
                            else {
                                cachedCcsCred = this.checkCcsCredentials();
                                if (cachedCcsCred) {
                                    this.authCodeRequest.ccsCredential = cachedCcsCred;
                                }
                            }
                            return [4 /*yield*/, this.authModule.acquireToken(this.authCodeRequest, authCodeResponse)];
                        case 3:
                            tokenResponse = _a.sent();
                            this.browserStorage.cleanRequestByState(state);
                            return [2 /*return*/, tokenResponse];
                    }
                });
            });
        };
        /**
         * Updates authority based on cloudInstanceHostname
         * @param cloudInstanceHostname
         * @param authority
         * @param networkModule
         */
        InteractionHandler.prototype.updateTokenEndpointAuthority = function (cloudInstanceHostname, authority, networkModule) {
            return __awaiter$1(this, void 0, void 0, function () {
                var cloudInstanceAuthorityUri, cloudInstanceAuthority;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cloudInstanceAuthorityUri = "https://" + cloudInstanceHostname + "/" + authority.tenant + "/";
                            return [4 /*yield*/, AuthorityFactory.createDiscoveredInstance(cloudInstanceAuthorityUri, networkModule, this.browserStorage, authority.options)];
                        case 1:
                            cloudInstanceAuthority = _a.sent();
                            this.authModule.updateAuthority(cloudInstanceAuthority);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Looks up ccs creds in the cache
         */
        InteractionHandler.prototype.checkCcsCredentials = function () {
            // Look up ccs credential in temp cache
            var cachedCcsCred = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, true);
            if (cachedCcsCred) {
                try {
                    return JSON.parse(cachedCcsCred);
                }
                catch (e) {
                    this.authModule.logger.error("Cache credential could not be parsed");
                    this.authModule.logger.errorPii("Cache credential could not be parsed: " + cachedCcsCred);
                }
            }
            return null;
        };
        return InteractionHandler;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var RedirectHandler = /** @class */ (function (_super) {
        __extends$1(RedirectHandler, _super);
        function RedirectHandler(authCodeModule, storageImpl, authCodeRequest, browserRequestLogger, browserCrypto) {
            var _this = _super.call(this, authCodeModule, storageImpl, authCodeRequest, browserRequestLogger) || this;
            _this.browserCrypto = browserCrypto;
            return _this;
        }
        /**
         * Redirects window to given URL.
         * @param urlNavigate
         */
        RedirectHandler.prototype.initiateAuthRequest = function (requestUrl, params) {
            return __awaiter$1(this, void 0, void 0, function () {
                var navigationOptions, navigate;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest called");
                            if (!!StringUtils.isEmpty(requestUrl)) return [3 /*break*/, 7];
                            // Cache start page, returns to this page after redirectUri if navigateToLoginRequestUrl is true
                            if (params.redirectStartPage) {
                                this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: redirectStartPage set, caching start page");
                                this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, params.redirectStartPage, true);
                            }
                            // Set interaction status in the library.
                            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
                            this.browserStorage.cacheCodeRequest(this.authCodeRequest, this.browserCrypto);
                            this.browserRequestLogger.infoPii("RedirectHandler.initiateAuthRequest: Navigate to: " + requestUrl);
                            navigationOptions = {
                                apiId: ApiId.acquireTokenRedirect,
                                timeout: params.redirectTimeout,
                                noHistory: false
                            };
                            if (!(typeof params.onRedirectNavigate === "function")) return [3 /*break*/, 4];
                            this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: Invoking onRedirectNavigate callback");
                            navigate = params.onRedirectNavigate(requestUrl);
                            if (!(navigate !== false)) return [3 /*break*/, 2];
                            this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: onRedirectNavigate did not return false, navigating");
                            return [4 /*yield*/, params.navigationClient.navigateExternal(requestUrl, navigationOptions)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                        case 2:
                            this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: onRedirectNavigate returned false, stopping navigation");
                            return [2 /*return*/];
                        case 3: return [3 /*break*/, 6];
                        case 4:
                            // Navigate window to request URL
                            this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: Navigating window to navigate url");
                            return [4 /*yield*/, params.navigationClient.navigateExternal(requestUrl, navigationOptions)];
                        case 5:
                            _a.sent();
                            return [2 /*return*/];
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            // Throw error if request URL is empty.
                            this.browserRequestLogger.info("RedirectHandler.initiateAuthRequest: Navigate url is empty");
                            throw BrowserAuthError.createEmptyNavigationUriError();
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Handle authorization code response in the window.
         * @param hash
         */
        RedirectHandler.prototype.handleCodeResponse = function (locationHash, state, authority, networkModule, clientId) {
            return __awaiter$1(this, void 0, void 0, function () {
                var stateKey, requestState, authCodeResponse, nonceKey, cachedNonce, cachedCcsCred, tokenResponse;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.browserRequestLogger.verbose("RedirectHandler.handleCodeResponse called");
                            // Check that location hash isn't empty.
                            if (StringUtils.isEmpty(locationHash)) {
                                throw BrowserAuthError.createEmptyHashError(locationHash);
                            }
                            // Interaction is completed - remove interaction status.
                            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
                            stateKey = this.browserStorage.generateStateKey(state);
                            requestState = this.browserStorage.getTemporaryCache(stateKey);
                            if (!requestState) {
                                throw ClientAuthError.createStateNotFoundError("Cached State");
                            }
                            authCodeResponse = this.authModule.handleFragmentResponse(locationHash, requestState);
                            nonceKey = this.browserStorage.generateNonceKey(requestState);
                            cachedNonce = this.browserStorage.getTemporaryCache(nonceKey);
                            // Assign code to request
                            this.authCodeRequest.code = authCodeResponse.code;
                            if (!authCodeResponse.cloud_instance_host_name) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.updateTokenEndpointAuthority(authCodeResponse.cloud_instance_host_name, authority, networkModule)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            authCodeResponse.nonce = cachedNonce || undefined;
                            authCodeResponse.state = requestState;
                            // Add CCS parameters if available
                            if (authCodeResponse.client_info) {
                                this.authCodeRequest.clientInfo = authCodeResponse.client_info;
                            }
                            else {
                                cachedCcsCred = this.checkCcsCredentials();
                                if (cachedCcsCred) {
                                    this.authCodeRequest.ccsCredential = cachedCcsCred;
                                }
                            }
                            // Remove throttle if it exists
                            if (clientId) {
                                ThrottlingUtils.removeThrottle(this.browserStorage, clientId, this.authCodeRequest.authority, this.authCodeRequest.scopes);
                            }
                            return [4 /*yield*/, this.authModule.acquireToken(this.authCodeRequest, authCodeResponse)];
                        case 3:
                            tokenResponse = _a.sent();
                            this.browserStorage.cleanRequestByState(state);
                            return [2 /*return*/, tokenResponse];
                    }
                });
            });
        };
        return RedirectHandler;
    }(InteractionHandler));

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var PopupUtils = /** @class */ (function () {
        function PopupUtils(storageImpl, logger) {
            this.browserStorage = storageImpl;
            this.logger = logger;
            // Properly sets this reference for the unload event.
            this.unloadWindow = this.unloadWindow.bind(this);
        }
        /**
         * @hidden
         *
         * Configures popup window for login.
         *
         * @param urlNavigate
         * @param title
         * @param popUpWidth
         * @param popUpHeight
         * @ignore
         * @hidden
         */
        PopupUtils.prototype.openPopup = function (urlNavigate, popupName, popup) {
            try {
                var popupWindow = void 0;
                // Popup window passed in, setting url to navigate to
                if (popup) {
                    popupWindow = popup;
                    this.logger.verbosePii("Navigating popup window to: " + urlNavigate);
                    popupWindow.location.assign(urlNavigate);
                }
                else if (typeof popup === "undefined") {
                    // Popup will be undefined if it was not passed in
                    this.logger.verbosePii("Opening popup window to: " + urlNavigate);
                    popupWindow = PopupUtils.openSizedPopup(urlNavigate, popupName);
                }
                // Popup will be null if popups are blocked
                if (!popupWindow) {
                    throw BrowserAuthError.createEmptyWindowCreatedError();
                }
                if (popupWindow.focus) {
                    popupWindow.focus();
                }
                this.currentWindow = popupWindow;
                window.addEventListener("beforeunload", this.unloadWindow);
                return popupWindow;
            }
            catch (e) {
                this.logger.error("error opening popup " + e.message);
                this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
                throw BrowserAuthError.createPopupWindowError(e.toString());
            }
        };
        PopupUtils.openSizedPopup = function (urlNavigate, popupName) {
            /**
             * adding winLeft and winTop to account for dual monitor
             * using screenLeft and screenTop for IE8 and earlier
             */
            var winLeft = window.screenLeft ? window.screenLeft : window.screenX;
            var winTop = window.screenTop ? window.screenTop : window.screenY;
            /**
             * window.innerWidth displays browser window"s height and width excluding toolbars
             * using document.documentElement.clientWidth for IE8 and earlier
             */
            var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var left = Math.max(0, ((width / 2) - (BrowserConstants.POPUP_WIDTH / 2)) + winLeft);
            var top = Math.max(0, ((height / 2) - (BrowserConstants.POPUP_HEIGHT / 2)) + winTop);
            return window.open(urlNavigate, popupName, "width=" + BrowserConstants.POPUP_WIDTH + ", height=" + BrowserConstants.POPUP_HEIGHT + ", top=" + top + ", left=" + left + ", scrollbars=yes");
        };
        /**
         * Event callback to unload main window.
         */
        PopupUtils.prototype.unloadWindow = function (e) {
            this.browserStorage.cleanRequestByInteractionType(InteractionType.Popup);
            if (this.currentWindow) {
                this.currentWindow.close();
            }
            // Guarantees browser unload will happen, so no other errors will be thrown.
            e.preventDefault();
        };
        /**
         * Closes popup, removes any state vars created during popup calls.
         * @param popupWindow
         */
        PopupUtils.prototype.cleanPopup = function (popupWindow) {
            if (popupWindow) {
                // Close window.
                popupWindow.close();
            }
            // Remove window unload function
            window.removeEventListener("beforeunload", this.unloadWindow);
            // Interaction is completed - remove interaction status.
            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
        };
        /**
         * Monitors a window until it loads a url with the same origin.
         * @param popupWindow - window that is being monitored
         */
        PopupUtils.prototype.monitorPopupForSameOrigin = function (popupWindow) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var intervalId = setInterval(function () {
                    if (popupWindow.closed) {
                        // Window is closed
                        _this.cleanPopup();
                        clearInterval(intervalId);
                        reject(BrowserAuthError.createUserCancelledError());
                        return;
                    }
                    var href = Constants.EMPTY_STRING;
                    try {
                        /*
                         * Will throw if cross origin,
                         * which should be caught and ignored
                         * since we need the interval to keep running while on STS UI.
                         */
                        href = popupWindow.location.href;
                    }
                    catch (e) { }
                    // Don't process blank pages or cross domain
                    if (StringUtils.isEmpty(href) || href === "about:blank") {
                        return;
                    }
                    clearInterval(intervalId);
                    resolve();
                }, BrowserConstants.POLL_INTERVAL_MS);
            });
        };
        /**
         * Generates the name for the popup based on the client id and request
         * @param clientId
         * @param request
         */
        PopupUtils.generatePopupName = function (clientId, request) {
            return BrowserConstants.POPUP_NAME_PREFIX + "." + clientId + "." + request.scopes.join("-") + "." + request.authority + "." + request.correlationId;
        };
        /**
         * Generates the name for the popup based on the client id and request for logouts
         * @param clientId
         * @param request
         */
        PopupUtils.generateLogoutPopupName = function (clientId, request) {
            var homeAccountId = request.account && request.account.homeAccountId;
            return BrowserConstants.POPUP_NAME_PREFIX + "." + clientId + "." + homeAccountId + "." + request.correlationId;
        };
        return PopupUtils;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * This class implements the interaction handler base class for browsers. It is written specifically for handling
     * popup window scenarios. It includes functions for monitoring the popup window for a hash.
     */
    var PopupHandler = /** @class */ (function (_super) {
        __extends$1(PopupHandler, _super);
        function PopupHandler(authCodeModule, storageImpl, authCodeRequest, browserRequestLogger) {
            var _this = _super.call(this, authCodeModule, storageImpl, authCodeRequest, browserRequestLogger) || this;
            // Properly sets this reference for the unload event.
            _this.popupUtils = new PopupUtils(storageImpl, browserRequestLogger);
            return _this;
        }
        /**
         * Opens a popup window with given request Url.
         * @param requestUrl
         */
        PopupHandler.prototype.initiateAuthRequest = function (requestUrl, params) {
            // Check that request url is not empty.
            if (!StringUtils.isEmpty(requestUrl)) {
                // Set interaction status in the library.
                this.browserStorage.setTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
                this.browserRequestLogger.infoPii("Navigate to: " + requestUrl);
                // Open the popup window to requestUrl.
                return this.popupUtils.openPopup(requestUrl, params.popupName, params.popup);
            }
            else {
                // Throw error if request URL is empty.
                this.browserRequestLogger.error("Navigate url is empty");
                throw BrowserAuthError.createEmptyNavigationUriError();
            }
        };
        /**
         * Monitors a window until it loads a url with a known hash, or hits a specified timeout.
         * @param popupWindow - window that is being monitored
         * @param timeout - milliseconds until timeout
         */
        PopupHandler.prototype.monitorPopupForHash = function (popupWindow) {
            var _this = this;
            return this.popupUtils.monitorPopupForSameOrigin(popupWindow).then(function () {
                var contentHash = popupWindow.location.hash;
                BrowserUtils.clearHash(popupWindow);
                _this.popupUtils.cleanPopup(popupWindow);
                if (!contentHash) {
                    throw BrowserAuthError.createEmptyHashError(popupWindow.location.href);
                }
                if (UrlString.hashContainsKnownProperties(contentHash)) {
                    return contentHash;
                }
                else {
                    throw BrowserAuthError.createHashDoesNotContainKnownPropertiesError();
                }
            });
        };
        return PopupHandler;
    }(InteractionHandler));

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var SilentHandler = /** @class */ (function (_super) {
        __extends$1(SilentHandler, _super);
        function SilentHandler(authCodeModule, storageImpl, authCodeRequest, browserRequestLogger, navigateFrameWait) {
            var _this = _super.call(this, authCodeModule, storageImpl, authCodeRequest, browserRequestLogger) || this;
            _this.navigateFrameWait = navigateFrameWait;
            return _this;
        }
        /**
         * Creates a hidden iframe to given URL using user-requested scopes as an id.
         * @param urlNavigate
         * @param userRequestScopes
         */
        SilentHandler.prototype.initiateAuthRequest = function (requestUrl) {
            return __awaiter$1(this, void 0, void 0, function () {
                var _a;
                return __generator$1(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (StringUtils.isEmpty(requestUrl)) {
                                // Throw error if request URL is empty.
                                this.browserRequestLogger.info("Navigate url is empty");
                                throw BrowserAuthError.createEmptyNavigationUriError();
                            }
                            if (!this.navigateFrameWait) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.loadFrame(requestUrl)];
                        case 1:
                            _a = _b.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = this.loadFrameSync(requestUrl);
                            _b.label = 3;
                        case 3: return [2 /*return*/, _a];
                    }
                });
            });
        };
        /**
         * Monitors an iframe content window until it loads a url with a known hash, or hits a specified timeout.
         * @param iframe
         * @param timeout
         */
        SilentHandler.prototype.monitorIframeForHash = function (iframe, timeout) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (timeout < DEFAULT_IFRAME_TIMEOUT_MS) {
                    _this.browserRequestLogger.warning("system.loadFrameTimeout or system.iframeHashTimeout set to lower (" + timeout + "ms) than the default (" + DEFAULT_IFRAME_TIMEOUT_MS + "ms). This may result in timeouts.");
                }
                /*
                 * Polling for iframes can be purely timing based,
                 * since we don't need to account for interaction.
                 */
                var nowMark = window.performance.now();
                var timeoutMark = nowMark + timeout;
                var intervalId = setInterval(function () {
                    if (window.performance.now() > timeoutMark) {
                        _this.removeHiddenIframe(iframe);
                        clearInterval(intervalId);
                        reject(BrowserAuthError.createMonitorIframeTimeoutError());
                        return;
                    }
                    var href = Constants.EMPTY_STRING;
                    var contentWindow = iframe.contentWindow;
                    try {
                        /*
                         * Will throw if cross origin,
                         * which should be caught and ignored
                         * since we need the interval to keep running while on STS UI.
                         */
                        href = contentWindow ? contentWindow.location.href : Constants.EMPTY_STRING;
                    }
                    catch (e) { }
                    if (StringUtils.isEmpty(href)) {
                        return;
                    }
                    var contentHash = contentWindow ? contentWindow.location.hash : Constants.EMPTY_STRING;
                    if (UrlString.hashContainsKnownProperties(contentHash)) {
                        // Success case
                        _this.removeHiddenIframe(iframe);
                        clearInterval(intervalId);
                        resolve(contentHash);
                        return;
                    }
                }, BrowserConstants.POLL_INTERVAL_MS);
            });
        };
        /**
         * @hidden
         * Loads iframe with authorization endpoint URL
         * @ignore
         */
        SilentHandler.prototype.loadFrame = function (urlNavigate) {
            /*
             * This trick overcomes iframe navigation in IE
             * IE does not load the page consistently in iframe
             */
            var _this = this;
            return new Promise(function (resolve, reject) {
                var frameHandle = _this.createHiddenIframe();
                setTimeout(function () {
                    if (!frameHandle) {
                        reject("Unable to load iframe");
                        return;
                    }
                    frameHandle.src = urlNavigate;
                    resolve(frameHandle);
                }, _this.navigateFrameWait);
            });
        };
        /**
         * @hidden
         * Loads the iframe synchronously when the navigateTimeFrame is set to `0`
         * @param urlNavigate
         * @param frameName
         * @param logger
         */
        SilentHandler.prototype.loadFrameSync = function (urlNavigate) {
            var frameHandle = this.createHiddenIframe();
            frameHandle.src = urlNavigate;
            return frameHandle;
        };
        /**
         * @hidden
         * Creates a new hidden iframe or gets an existing one for silent token renewal.
         * @ignore
         */
        SilentHandler.prototype.createHiddenIframe = function () {
            var authFrame = document.createElement("iframe");
            authFrame.style.visibility = "hidden";
            authFrame.style.position = "absolute";
            authFrame.style.width = authFrame.style.height = "0";
            authFrame.style.border = "0";
            authFrame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
            document.getElementsByTagName("body")[0].appendChild(authFrame);
            return authFrame;
        };
        /**
         * @hidden
         * Removes a hidden iframe from the page.
         * @ignore
         */
        SilentHandler.prototype.removeHiddenIframe = function (iframe) {
            if (document.body === iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        };
        return SilentHandler;
    }(InteractionHandler));

    /*! @azure/msal-browser v2.15.0 2021-06-29 */
    /* eslint-disable header/header */
    var name = "@azure/msal-browser";
    var version = "2.15.0";

    /*! @azure/msal-browser v2.15.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var EventType;
    (function (EventType) {
        EventType["LOGIN_START"] = "msal:loginStart";
        EventType["LOGIN_SUCCESS"] = "msal:loginSuccess";
        EventType["LOGIN_FAILURE"] = "msal:loginFailure";
        EventType["ACQUIRE_TOKEN_START"] = "msal:acquireTokenStart";
        EventType["ACQUIRE_TOKEN_SUCCESS"] = "msal:acquireTokenSuccess";
        EventType["ACQUIRE_TOKEN_FAILURE"] = "msal:acquireTokenFailure";
        EventType["ACQUIRE_TOKEN_NETWORK_START"] = "msal:acquireTokenFromNetworkStart";
        EventType["SSO_SILENT_START"] = "msal:ssoSilentStart";
        EventType["SSO_SILENT_SUCCESS"] = "msal:ssoSilentSuccess";
        EventType["SSO_SILENT_FAILURE"] = "msal:ssoSilentFailure";
        EventType["HANDLE_REDIRECT_START"] = "msal:handleRedirectStart";
        EventType["HANDLE_REDIRECT_END"] = "msal:handleRedirectEnd";
        EventType["POPUP_OPENED"] = "msal:popupOpened";
        EventType["LOGOUT_START"] = "msal:logoutStart";
        EventType["LOGOUT_SUCCESS"] = "msal:logoutSuccess";
        EventType["LOGOUT_FAILURE"] = "msal:logoutFailure";
        EventType["LOGOUT_END"] = "msal:logoutEnd";
    })(EventType || (EventType = {}));

    /*! @azure/msal-browser v2.15.0 2021-06-29 */
    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var EventHandler = /** @class */ (function () {
        function EventHandler(logger, browserCrypto) {
            this.eventCallbacks = new Map();
            this.logger = logger;
            this.browserCrypto = browserCrypto;
        }
        /**
         * Adds event callbacks to array
         * @param callback
         */
        EventHandler.prototype.addEventCallback = function (callback) {
            if (typeof window !== "undefined") {
                var callbackId = this.browserCrypto.createNewGuid();
                this.eventCallbacks.set(callbackId, callback);
                this.logger.verbose("Event callback registered with id: " + callbackId);
                return callbackId;
            }
            return null;
        };
        /**
         * Removes callback with provided id from callback array
         * @param callbackId
         */
        EventHandler.prototype.removeEventCallback = function (callbackId) {
            this.eventCallbacks.delete(callbackId);
            this.logger.verbose("Event callback " + callbackId + " removed.");
        };
        /**
         * Emits events by calling callback with event message
         * @param eventType
         * @param interactionType
         * @param payload
         * @param error
         */
        EventHandler.prototype.emitEvent = function (eventType, interactionType, payload, error) {
            var _this = this;
            if (typeof window !== "undefined") {
                var message_1 = {
                    eventType: eventType,
                    interactionType: interactionType || null,
                    payload: payload || null,
                    error: error || null,
                    timestamp: Date.now()
                };
                this.logger.info("Emitting event: " + eventType);
                this.eventCallbacks.forEach(function (callback, callbackId) {
                    _this.logger.verbose("Emitting event to callback " + callbackId + ": " + eventType);
                    callback.apply(null, [message_1]);
                });
            }
        };
        return EventHandler;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    var ClientApplication = /** @class */ (function () {
        /**
         * @constructor
         * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
         *
         * Important attributes in the Configuration object for auth are:
         * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
         * - authority: the authority URL for your application.
         * - redirect_uri: the uri of your application registered in the portal.
         *
         * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
         * It is of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}
         * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
         * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
         * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
         * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
         *
         * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
         * Full B2C functionality will be available in this library in future versions.
         *
         * @param configuration Object for the MSAL PublicClientApplication instance
         */
        function ClientApplication(configuration) {
            /*
             * If loaded in an environment where window is not available,
             * set internal flag to false so that further requests fail.
             * This is to support server-side rendering environments.
             */
            this.isBrowserEnvironment = typeof window !== "undefined";
            // Set the configuration.
            this.config = buildConfiguration(configuration, this.isBrowserEnvironment);
            this.activeLocalAccountId = null;
            // Initialize logger
            this.logger = new Logger(this.config.system.loggerOptions, name, version);
            // Initialize the network module class.
            this.networkClient = this.config.system.networkClient;
            // Initialize the navigation client class.
            this.navigationClient = this.config.system.navigationClient;
            // Initialize redirectResponse Map
            this.redirectResponse = new Map();
            // Initialize the crypto class.
            this.browserCrypto = this.isBrowserEnvironment ? new CryptoOps() : DEFAULT_CRYPTO_IMPLEMENTATION;
            this.eventHandler = new EventHandler(this.logger, this.browserCrypto);
            // Initialize the browser storage class.
            this.browserStorage = this.isBrowserEnvironment ?
                new BrowserCacheManager(this.config.auth.clientId, this.config.cache, this.browserCrypto, this.logger) :
                DEFAULT_BROWSER_CACHE_MANAGER(this.config.auth.clientId, this.logger);
        }
        // #region Redirect Flow
        /**
         * Event handler function which allows users to fire events after the PublicClientApplication object
         * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
         * auth flows.
         * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
         * @returns Token response or null. If the return value is null, then no auth redirect was detected.
         */
        ClientApplication.prototype.handleRedirectPromise = function (hash) {
            return __awaiter$1(this, void 0, void 0, function () {
                var loggedInAccounts, redirectResponseKey, response;
                var _this = this;
                return __generator$1(this, function (_a) {
                    this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
                    this.logger.verbose("handleRedirectPromise called");
                    loggedInAccounts = this.getAllAccounts();
                    if (this.isBrowserEnvironment) {
                        redirectResponseKey = hash || Constants.EMPTY_STRING;
                        response = this.redirectResponse.get(redirectResponseKey);
                        if (typeof response === "undefined") {
                            this.logger.verbose("handleRedirectPromise has been called for the first time, storing the promise");
                            response = this.handleRedirectResponse(hash)
                                .then(function (result) {
                                if (result) {
                                    // Emit login event if number of accounts change
                                    var isLoggingIn = loggedInAccounts.length < _this.getAllAccounts().length;
                                    if (isLoggingIn) {
                                        _this.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Redirect, result);
                                        _this.logger.verbose("handleRedirectResponse returned result, login success");
                                    }
                                    else {
                                        _this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Redirect, result);
                                        _this.logger.verbose("handleRedirectResponse returned result, acquire token success");
                                    }
                                }
                                _this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);
                                return result;
                            })
                                .catch(function (e) {
                                // Emit login event if there is an account
                                if (loggedInAccounts.length > 0) {
                                    _this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, e);
                                }
                                else {
                                    _this.eventHandler.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, e);
                                }
                                _this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);
                                throw e;
                            });
                            this.redirectResponse.set(redirectResponseKey, response);
                        }
                        else {
                            this.logger.verbose("handleRedirectPromise has been called previously, returning the result from the first call");
                        }
                        return [2 /*return*/, response];
                    }
                    this.logger.verbose("handleRedirectPromise returns null, not browser environment");
                    return [2 /*return*/, null];
                });
            });
        };
        /**
         * Checks if navigateToLoginRequestUrl is set, and:
         * - if true, performs logic to cache and navigate
         * - if false, handles hash string and parses response
         * @param hash
         */
        ClientApplication.prototype.handleRedirectResponse = function (hash) {
            return __awaiter$1(this, void 0, void 0, function () {
                var responseHash, state, loginRequestUrl, loginRequestUrlNormalized, currentUrlNormalized, handleHashResult, navigationOptions, processHashOnRedirect, homepage;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.interactionInProgress()) {
                                this.logger.info("handleRedirectPromise called but there is no interaction in progress, returning null.");
                                return [2 /*return*/, null];
                            }
                            responseHash = this.getRedirectResponseHash(hash || window.location.hash);
                            if (!responseHash) {
                                // Not a recognized server response hash or hash not associated with a redirect request
                                this.logger.info("handleRedirectPromise did not detect a response hash as a result of a redirect. Cleaning temporary cache.");
                                this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
                                return [2 /*return*/, null];
                            }
                            try {
                                state = this.validateAndExtractStateFromHash(responseHash, InteractionType.Redirect);
                                BrowserUtils.clearHash(window);
                                this.logger.verbose("State extracted from hash");
                            }
                            catch (e) {
                                this.logger.info("handleRedirectPromise was unable to extract state due to: " + e);
                                this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
                                return [2 /*return*/, null];
                            }
                            loginRequestUrl = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, true) || "";
                            loginRequestUrlNormalized = UrlString.removeHashFromUrl(loginRequestUrl);
                            currentUrlNormalized = UrlString.removeHashFromUrl(window.location.href);
                            if (!(loginRequestUrlNormalized === currentUrlNormalized && this.config.auth.navigateToLoginRequestUrl)) return [3 /*break*/, 2];
                            // We are on the page we need to navigate to - handle hash
                            this.logger.verbose("Current page is loginRequestUrl, handling hash");
                            return [4 /*yield*/, this.handleHash(responseHash, state)];
                        case 1:
                            handleHashResult = _a.sent();
                            if (loginRequestUrl.indexOf("#") > -1) {
                                // Replace current hash with non-msal hash, if present
                                BrowserUtils.replaceHash(loginRequestUrl);
                            }
                            return [2 /*return*/, handleHashResult];
                        case 2:
                            if (!!this.config.auth.navigateToLoginRequestUrl) return [3 /*break*/, 3];
                            this.logger.verbose("NavigateToLoginRequestUrl set to false, handling hash");
                            return [2 /*return*/, this.handleHash(responseHash, state)];
                        case 3:
                            if (!!BrowserUtils.isInIframe()) return [3 /*break*/, 8];
                            /*
                             * Returned from authority using redirect - need to perform navigation before processing response
                             * Cache the hash to be retrieved after the next redirect
                             */
                            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.URL_HASH, responseHash, true);
                            navigationOptions = {
                                apiId: ApiId.handleRedirectPromise,
                                timeout: this.config.system.redirectNavigationTimeout,
                                noHistory: true
                            };
                            processHashOnRedirect = true;
                            if (!(!loginRequestUrl || loginRequestUrl === "null")) return [3 /*break*/, 5];
                            homepage = BrowserUtils.getHomepage();
                            // Cache the homepage under ORIGIN_URI to ensure cached hash is processed on homepage
                            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, homepage, true);
                            this.logger.warning("Unable to get valid login request url from cache, redirecting to home page");
                            return [4 /*yield*/, this.navigationClient.navigateInternal(homepage, navigationOptions)];
                        case 4:
                            processHashOnRedirect = _a.sent();
                            return [3 /*break*/, 7];
                        case 5:
                            // Navigate to page that initiated the redirect request
                            this.logger.verbose("Navigating to loginRequestUrl: " + loginRequestUrl);
                            return [4 /*yield*/, this.navigationClient.navigateInternal(loginRequestUrl, navigationOptions)];
                        case 6:
                            processHashOnRedirect = _a.sent();
                            _a.label = 7;
                        case 7:
                            // If navigateInternal implementation returns false, handle the hash now
                            if (!processHashOnRedirect) {
                                return [2 /*return*/, this.handleHash(responseHash, state)];
                            }
                            _a.label = 8;
                        case 8: return [2 /*return*/, null];
                    }
                });
            });
        };
        /**
         * Gets the response hash for a redirect request
         * Returns null if interactionType in the state value is not "redirect" or the hash does not contain known properties
         * @param hash
         */
        ClientApplication.prototype.getRedirectResponseHash = function (hash) {
            this.logger.verbose("getRedirectResponseHash called");
            // Get current location hash from window or cache.
            var isResponseHash = UrlString.hashContainsKnownProperties(hash);
            var cachedHash = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.URL_HASH, true);
            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH));
            if (isResponseHash) {
                this.logger.verbose("Hash contains known properties, returning response hash");
                return hash;
            }
            this.logger.verbose("Hash does not contain known properties, returning cached hash");
            return cachedHash;
        };
        /**
         * @param hash
         * @param interactionType
         */
        ClientApplication.prototype.validateAndExtractStateFromHash = function (hash, interactionType, requestCorrelationId) {
            this.logger.verbose("validateAndExtractStateFromHash called", requestCorrelationId);
            // Deserialize hash fragment response parameters.
            var serverParams = UrlString.getDeserializedHash(hash);
            if (!serverParams.state) {
                throw BrowserAuthError.createHashDoesNotContainStateError();
            }
            var platformStateObj = BrowserProtocolUtils.extractBrowserRequestState(this.browserCrypto, serverParams.state);
            if (!platformStateObj) {
                throw BrowserAuthError.createUnableToParseStateError();
            }
            if (platformStateObj.interactionType !== interactionType) {
                throw BrowserAuthError.createStateInteractionTypeMismatchError();
            }
            this.logger.verbose("Returning state from hash", requestCorrelationId);
            return serverParams.state;
        };
        /**
         * Checks if hash exists and handles in window.
         * @param hash
         * @param state
         */
        ClientApplication.prototype.handleHash = function (hash, state) {
            return __awaiter$1(this, void 0, void 0, function () {
                var cachedRequest, browserRequestLogger, serverTelemetryManager, currentAuthority, authClient, interactionHandler, e_1;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cachedRequest = this.browserStorage.getCachedRequest(state, this.browserCrypto);
                            browserRequestLogger = this.logger.clone(name, version, cachedRequest.correlationId);
                            browserRequestLogger.verbose("handleHash called, retrieved cached request");
                            serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.handleRedirectPromise, cachedRequest.correlationId);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            currentAuthority = this.browserStorage.getCachedAuthority(state);
                            if (!currentAuthority) {
                                throw BrowserAuthError.createNoCachedAuthorityError();
                            }
                            return [4 /*yield*/, this.createAuthCodeClient(serverTelemetryManager, currentAuthority, cachedRequest.correlationId)];
                        case 2:
                            authClient = _a.sent();
                            browserRequestLogger.verbose("Auth code client created");
                            interactionHandler = new RedirectHandler(authClient, this.browserStorage, cachedRequest, browserRequestLogger, this.browserCrypto);
                            return [4 /*yield*/, interactionHandler.handleCodeResponse(hash, state, authClient.authority, this.networkClient, this.config.auth.clientId)];
                        case 3: return [2 /*return*/, _a.sent()];
                        case 4:
                            e_1 = _a.sent();
                            serverTelemetryManager.cacheFailedRequest(e_1);
                            this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
                            throw e_1;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects
         * the page, so any code that follows this function will not execute.
         *
         * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
         * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
         *
         * @param request
         */
        ClientApplication.prototype.acquireTokenRedirect = function (request) {
            return __awaiter$1(this, void 0, void 0, function () {
                var isLoggedIn, validRequest, browserRequestLogger, serverTelemetryManager, authCodeRequest, authClient, interactionHandler, navigateUrl, redirectStartPage, e_2;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Preflight request
                            this.preflightBrowserEnvironmentCheck(InteractionType.Redirect);
                            this.logger.verbose("acquireTokenRedirect called");
                            isLoggedIn = this.getAllAccounts().length > 0;
                            if (isLoggedIn) {
                                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Redirect, request);
                            }
                            else {
                                this.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Redirect, request);
                            }
                            validRequest = this.preflightInteractiveRequest(request, InteractionType.Redirect);
                            browserRequestLogger = this.logger.clone(name, version, validRequest.correlationId);
                            serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenRedirect, validRequest.correlationId);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 5, , 6]);
                            return [4 /*yield*/, this.initializeAuthorizationCodeRequest(validRequest)];
                        case 2:
                            authCodeRequest = _a.sent();
                            return [4 /*yield*/, this.createAuthCodeClient(serverTelemetryManager, validRequest.authority, validRequest.correlationId)];
                        case 3:
                            authClient = _a.sent();
                            browserRequestLogger.verbose("Auth code client created");
                            interactionHandler = new RedirectHandler(authClient, this.browserStorage, authCodeRequest, browserRequestLogger, this.browserCrypto);
                            return [4 /*yield*/, authClient.getAuthCodeUrl(validRequest)];
                        case 4:
                            navigateUrl = _a.sent();
                            redirectStartPage = this.getRedirectStartPage(request.redirectStartPage);
                            browserRequestLogger.verbosePii("Redirect start page: " + redirectStartPage);
                            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
                            return [2 /*return*/, interactionHandler.initiateAuthRequest(navigateUrl, {
                                    navigationClient: this.navigationClient,
                                    redirectTimeout: this.config.system.redirectNavigationTimeout,
                                    redirectStartPage: redirectStartPage,
                                    onRedirectNavigate: request.onRedirectNavigate
                                })];
                        case 5:
                            e_2 = _a.sent();
                            // If logged in, emit acquire token events
                            if (isLoggedIn) {
                                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, e_2);
                            }
                            else {
                                this.eventHandler.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, e_2);
                            }
                            serverTelemetryManager.cacheFailedRequest(e_2);
                            this.browserStorage.cleanRequestByState(validRequest.state);
                            throw e_2;
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        // #endregion
        // #region Popup Flow
        /**
         * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
         *
         * @param request
         *
         * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
         */
        ClientApplication.prototype.acquireTokenPopup = function (request) {
            var validRequest;
            try {
                this.preflightBrowserEnvironmentCheck(InteractionType.Popup);
                this.logger.verbose("acquireTokenPopup called", request.correlationId);
                validRequest = this.preflightInteractiveRequest(request, InteractionType.Popup);
            }
            catch (e) {
                // Since this function is syncronous we need to reject
                return Promise.reject(e);
            }
            var popupName = PopupUtils.generatePopupName(this.config.auth.clientId, validRequest);
            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                this.logger.verbose("asyncPopups set to true, acquiring token", validRequest.correlationId);
                return this.acquireTokenPopupAsync(validRequest, popupName);
            }
            else {
                // asyncPopups flag is set to false. Opens popup before acquiring token.
                this.logger.verbose("asyncPopup set to false, opening popup before acquiring token", validRequest.correlationId);
                var popup = PopupUtils.openSizedPopup("about:blank", popupName);
                return this.acquireTokenPopupAsync(validRequest, popupName, popup);
            }
        };
        /**
         * Helper which obtains an access_token for your API via opening a popup window in the user's browser
         * @param validRequest
         * @param popupName
         * @param popup
         *
         * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
         */
        ClientApplication.prototype.acquireTokenPopupAsync = function (validRequest, popupName, popup) {
            return __awaiter$1(this, void 0, void 0, function () {
                var loggedInAccounts, browserRequestLogger, serverTelemetryManager, authCodeRequest, authClient, navigateUrl, interactionHandler, popupParameters, popupWindow, hash, state, result, isLoggingIn, e_3;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.verbose("acquireTokenPopupAsync called", validRequest.correlationId);
                            loggedInAccounts = this.getAllAccounts();
                            if (loggedInAccounts.length > 0) {
                                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Popup, validRequest);
                            }
                            else {
                                this.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup, validRequest);
                            }
                            browserRequestLogger = this.logger.clone(name, version, validRequest.correlationId);
                            serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenPopup, validRequest.correlationId);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 7, , 8]);
                            return [4 /*yield*/, this.initializeAuthorizationCodeRequest(validRequest)];
                        case 2:
                            authCodeRequest = _a.sent();
                            return [4 /*yield*/, this.createAuthCodeClient(serverTelemetryManager, validRequest.authority, validRequest.correlationId)];
                        case 3:
                            authClient = _a.sent();
                            browserRequestLogger.verbose("Auth code client created");
                            return [4 /*yield*/, authClient.getAuthCodeUrl(validRequest)];
                        case 4:
                            navigateUrl = _a.sent();
                            interactionHandler = new PopupHandler(authClient, this.browserStorage, authCodeRequest, browserRequestLogger);
                            popupParameters = {
                                popup: popup,
                                popupName: popupName
                            };
                            popupWindow = interactionHandler.initiateAuthRequest(navigateUrl, popupParameters);
                            this.eventHandler.emitEvent(EventType.POPUP_OPENED, InteractionType.Popup, { popupWindow: popupWindow }, null);
                            return [4 /*yield*/, interactionHandler.monitorPopupForHash(popupWindow)];
                        case 5:
                            hash = _a.sent();
                            state = this.validateAndExtractStateFromHash(hash, InteractionType.Popup, validRequest.correlationId);
                            // Remove throttle if it exists
                            ThrottlingUtils.removeThrottle(this.browserStorage, this.config.auth.clientId, authCodeRequest.authority, authCodeRequest.scopes);
                            return [4 /*yield*/, interactionHandler.handleCodeResponse(hash, state, authClient.authority, this.networkClient)];
                        case 6:
                            result = _a.sent();
                            isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
                            if (isLoggingIn) {
                                this.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Popup, result);
                            }
                            else {
                                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Popup, result);
                            }
                            return [2 /*return*/, result];
                        case 7:
                            e_3 = _a.sent();
                            if (loggedInAccounts.length > 0) {
                                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Popup, null, e_3);
                            }
                            else {
                                this.eventHandler.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Popup, null, e_3);
                            }
                            if (popup) {
                                // Close the synchronous popup if an error is thrown before the window unload event is registered
                                popup.close();
                            }
                            serverTelemetryManager.cacheFailedRequest(e_3);
                            this.browserStorage.cleanRequestByState(validRequest.state);
                            throw e_3;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        // #endregion
        // #region Silent Flow
        /**
         * This function uses a hidden iframe to fetch an authorization code from the eSTS. There are cases where this may not work:
         * - Any browser using a form of Intelligent Tracking Prevention
         * - If there is not an established session with the service
         *
         * In these cases, the request must be done inside a popup or full frame redirect.
         *
         * For the cases where interaction is required, you cannot send a request with prompt=none.
         *
         * If your refresh token has expired, you can use this function to fetch a new set of tokens silently as long as
         * you session on the server still exists.
         * @param request {@link SsoSilentRequest}
         *
         * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
         */
        ClientApplication.prototype.ssoSilent = function (request) {
            return __awaiter$1(this, void 0, void 0, function () {
                var silentTokenResult, e_4;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.preflightBrowserEnvironmentCheck(InteractionType.Silent);
                            this.logger.verbose("ssoSilent called", request.correlationId);
                            this.eventHandler.emitEvent(EventType.SSO_SILENT_START, InteractionType.Silent, request);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.acquireTokenByIframe(request, ApiId.ssoSilent)];
                        case 2:
                            silentTokenResult = _a.sent();
                            this.eventHandler.emitEvent(EventType.SSO_SILENT_SUCCESS, InteractionType.Silent, silentTokenResult);
                            return [2 /*return*/, silentTokenResult];
                        case 3:
                            e_4 = _a.sent();
                            this.eventHandler.emitEvent(EventType.SSO_SILENT_FAILURE, InteractionType.Silent, null, e_4);
                            throw e_4;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * This function uses a hidden iframe to fetch an authorization code from the eSTS. To be used for silent refresh token acquisition and renewal.
         * @param request
         * @param apiId - ApiId of the calling function. Used for telemetry.
         */
        ClientApplication.prototype.acquireTokenByIframe = function (request, apiId) {
            return __awaiter$1(this, void 0, void 0, function () {
                var silentRequest, browserRequestLogger, serverTelemetryManager, authCodeRequest, authClient, navigateUrl, e_5;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.verbose("acquireTokenByIframe called", request.correlationId);
                            // Check that we have some SSO data
                            if (StringUtils.isEmpty(request.loginHint) && StringUtils.isEmpty(request.sid) && (!request.account || StringUtils.isEmpty(request.account.username))) {
                                throw BrowserAuthError.createSilentSSOInsufficientInfoError();
                            }
                            // Check that prompt is set to none, throw error if it is set to anything else.
                            if (request.prompt && request.prompt !== PromptValue.NONE) {
                                throw BrowserAuthError.createSilentPromptValueError(request.prompt);
                            }
                            silentRequest = this.initializeAuthorizationRequest(__assign$1(__assign$1({}, request), { prompt: PromptValue.NONE }), InteractionType.Silent);
                            browserRequestLogger = this.logger.clone(name, version, silentRequest.correlationId);
                            serverTelemetryManager = this.initializeServerTelemetryManager(apiId, silentRequest.correlationId);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 6, , 7]);
                            return [4 /*yield*/, this.initializeAuthorizationCodeRequest(silentRequest)];
                        case 2:
                            authCodeRequest = _a.sent();
                            return [4 /*yield*/, this.createAuthCodeClient(serverTelemetryManager, silentRequest.authority, silentRequest.correlationId)];
                        case 3:
                            authClient = _a.sent();
                            browserRequestLogger.verbose("Auth code client created");
                            return [4 /*yield*/, authClient.getAuthCodeUrl(silentRequest)];
                        case 4:
                            navigateUrl = _a.sent();
                            return [4 /*yield*/, this.silentTokenHelper(navigateUrl, authCodeRequest, authClient, browserRequestLogger)];
                        case 5: return [2 /*return*/, _a.sent()];
                        case 6:
                            e_5 = _a.sent();
                            serverTelemetryManager.cacheFailedRequest(e_5);
                            this.browserStorage.cleanRequestByState(silentRequest.state);
                            throw e_5;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Use this function to obtain a token before every call to the API / resource provider
         *
         * MSAL return's a cached token when available
         * Or it send's a request to the STS to obtain a new token using a refresh token.
         *
         * @param {@link SilentRequest}
         *
         * To renew idToken, please pass clientId as the only scope in the Authentication Parameters
         * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
         */
        ClientApplication.prototype.acquireTokenByRefreshToken = function (request) {
            return __awaiter$1(this, void 0, void 0, function () {
                var silentRequest, browserRequestLogger, serverTelemetryManager, refreshTokenClient, e_6, isServerError, isInteractionRequiredError, isInvalidGrantError;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_NETWORK_START, InteractionType.Silent, request);
                            // block the reload if it occurred inside a hidden iframe
                            BrowserUtils.blockReloadInHiddenIframes();
                            silentRequest = __assign$1(__assign$1({}, request), this.initializeBaseRequest(request));
                            browserRequestLogger = this.logger.clone(name, version, silentRequest.correlationId);
                            serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, silentRequest.correlationId);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 7]);
                            return [4 /*yield*/, this.createRefreshTokenClient(serverTelemetryManager, silentRequest.authority, silentRequest.correlationId)];
                        case 2:
                            refreshTokenClient = _a.sent();
                            browserRequestLogger.verbose("Refresh token client created");
                            return [4 /*yield*/, refreshTokenClient.acquireTokenByRefreshToken(silentRequest)];
                        case 3: 
                        // Send request to renew token. Auth module will throw errors if token cannot be renewed.
                        return [2 /*return*/, _a.sent()];
                        case 4:
                            e_6 = _a.sent();
                            serverTelemetryManager.cacheFailedRequest(e_6);
                            isServerError = e_6 instanceof ServerError;
                            isInteractionRequiredError = e_6 instanceof InteractionRequiredAuthError;
                            isInvalidGrantError = (e_6.errorCode === BrowserConstants.INVALID_GRANT_ERROR);
                            if (!(isServerError && isInvalidGrantError && !isInteractionRequiredError)) return [3 /*break*/, 6];
                            browserRequestLogger.verbose("Refresh token expired or invalid, attempting acquire token by iframe");
                            return [4 /*yield*/, this.acquireTokenByIframe(request, ApiId.acquireTokenSilent_authCode)];
                        case 5: return [2 /*return*/, _a.sent()];
                        case 6: throw e_6;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Helper which acquires an authorization code silently using a hidden iframe from given url
         * using the scopes requested as part of the id, and exchanges the code for a set of OAuth tokens.
         * @param navigateUrl
         * @param userRequestScopes
         */
        ClientApplication.prototype.silentTokenHelper = function (navigateUrl, authCodeRequest, authClient, browserRequestLogger) {
            return __awaiter$1(this, void 0, void 0, function () {
                var silentHandler, msalFrame, hash, state;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            silentHandler = new SilentHandler(authClient, this.browserStorage, authCodeRequest, browserRequestLogger, this.config.system.navigateFrameWait);
                            return [4 /*yield*/, silentHandler.initiateAuthRequest(navigateUrl)];
                        case 1:
                            msalFrame = _a.sent();
                            return [4 /*yield*/, silentHandler.monitorIframeForHash(msalFrame, this.config.system.iframeHashTimeout)];
                        case 2:
                            hash = _a.sent();
                            state = this.validateAndExtractStateFromHash(hash, InteractionType.Silent, authCodeRequest.correlationId);
                            // Handle response from hash string
                            return [2 /*return*/, silentHandler.handleCodeResponse(hash, state, authClient.authority, this.networkClient)];
                    }
                });
            });
        };
        // #endregion
        // #region Logout
        /**
         * Deprecated logout function. Use logoutRedirect or logoutPopup instead
         * @param logoutRequest
         * @deprecated
         */
        ClientApplication.prototype.logout = function (logoutRequest) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    this.logger.warning("logout API is deprecated and will be removed in msal-browser v3.0.0. Use logoutRedirect instead.");
                    return [2 /*return*/, this.logoutRedirect(logoutRequest)];
                });
            });
        };
        /**
         * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
         * Default behaviour is to redirect the user to `window.location.href`.
         * @param logoutRequest
         */
        ClientApplication.prototype.logoutRedirect = function (logoutRequest) {
            return __awaiter$1(this, void 0, void 0, function () {
                var validLogoutRequest, browserRequestLogger, serverTelemetryManager, authClient, logoutUri, navigationOptions, navigate, e_7;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.preflightBrowserEnvironmentCheck(InteractionType.Redirect);
                            this.logger.verbose("logoutRedirect called", logoutRequest === null || logoutRequest === void 0 ? void 0 : logoutRequest.correlationId);
                            validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
                            browserRequestLogger = this.logger.clone(name, version, validLogoutRequest.correlationId);
                            serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.logout, validLogoutRequest.correlationId);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 9, , 10]);
                            this.eventHandler.emitEvent(EventType.LOGOUT_START, InteractionType.Redirect, logoutRequest);
                            return [4 /*yield*/, this.createAuthCodeClient(serverTelemetryManager, logoutRequest && logoutRequest.authority, validLogoutRequest === null || validLogoutRequest === void 0 ? void 0 : validLogoutRequest.correlationId)];
                        case 2:
                            authClient = _a.sent();
                            browserRequestLogger.verbose("Auth code client created");
                            logoutUri = authClient.getLogoutUri(validLogoutRequest);
                            if (!validLogoutRequest.account || AccountEntity.accountInfoIsEqual(validLogoutRequest.account, this.getActiveAccount(), false)) {
                                browserRequestLogger.verbose("Setting active account to null");
                                this.setActiveAccount(null);
                            }
                            navigationOptions = {
                                apiId: ApiId.logout,
                                timeout: this.config.system.redirectNavigationTimeout,
                                noHistory: false
                            };
                            this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, InteractionType.Redirect, validLogoutRequest);
                            if (!(logoutRequest && typeof logoutRequest.onRedirectNavigate === "function")) return [3 /*break*/, 6];
                            navigate = logoutRequest.onRedirectNavigate(logoutUri);
                            if (!(navigate !== false)) return [3 /*break*/, 4];
                            browserRequestLogger.verbose("Logout onRedirectNavigate did not return false, navigating");
                            return [4 /*yield*/, this.navigationClient.navigateExternal(logoutUri, navigationOptions)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                        case 4:
                            browserRequestLogger.verbose("Logout onRedirectNavigate returned false, stopping navigation");
                            _a.label = 5;
                        case 5: return [3 /*break*/, 8];
                        case 6: return [4 /*yield*/, this.navigationClient.navigateExternal(logoutUri, navigationOptions)];
                        case 7:
                            _a.sent();
                            return [2 /*return*/];
                        case 8: return [3 /*break*/, 10];
                        case 9:
                            e_7 = _a.sent();
                            serverTelemetryManager.cacheFailedRequest(e_7);
                            this.eventHandler.emitEvent(EventType.LOGOUT_FAILURE, InteractionType.Redirect, null, e_7);
                            throw e_7;
                        case 10:
                            this.eventHandler.emitEvent(EventType.LOGOUT_END, InteractionType.Redirect);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
         * @param logoutRequest
         */
        ClientApplication.prototype.logoutPopup = function (logoutRequest) {
            var validLogoutRequest;
            try {
                this.preflightBrowserEnvironmentCheck(InteractionType.Popup);
                this.logger.verbose("logoutPopup called", logoutRequest === null || logoutRequest === void 0 ? void 0 : logoutRequest.correlationId);
                validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
            }
            catch (e) {
                // Since this function is synchronous we need to reject
                return Promise.reject(e);
            }
            var popupName = PopupUtils.generateLogoutPopupName(this.config.auth.clientId, validLogoutRequest);
            var popup;
            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                this.logger.verbose("asyncPopups set to true", validLogoutRequest.correlationId);
            }
            else {
                // asyncPopups flag is set to false. Opens popup before logging out.
                this.logger.verbose("asyncPopup set to false, opening popup", validLogoutRequest.correlationId);
                popup = PopupUtils.openSizedPopup("about:blank", popupName);
            }
            var authority = logoutRequest && logoutRequest.authority;
            var mainWindowRedirectUri = logoutRequest && logoutRequest.mainWindowRedirectUri;
            return this.logoutPopupAsync(validLogoutRequest, popupName, authority, popup, mainWindowRedirectUri);
        };
        /**
         *
         * @param request
         * @param popupName
         * @param requestAuthority
         * @param popup
         */
        ClientApplication.prototype.logoutPopupAsync = function (validRequest, popupName, requestAuthority, popup, mainWindowRedirectUri) {
            return __awaiter$1(this, void 0, void 0, function () {
                var browserRequestLogger, serverTelemetryManager, authClient, logoutUri, popupUtils, popupWindow, e_8, navigationOptions, absoluteUrl, e_9;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.verbose("logoutPopupAsync called", validRequest.correlationId);
                            this.eventHandler.emitEvent(EventType.LOGOUT_START, InteractionType.Popup, validRequest);
                            browserRequestLogger = this.logger.clone(name, version, validRequest.correlationId);
                            serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.logoutPopup, validRequest.correlationId);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 7, , 8]);
                            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
                            return [4 /*yield*/, this.createAuthCodeClient(serverTelemetryManager, requestAuthority, validRequest.correlationId)];
                        case 2:
                            authClient = _a.sent();
                            browserRequestLogger.verbose("Auth code client created");
                            logoutUri = authClient.getLogoutUri(validRequest);
                            if (!validRequest.account || AccountEntity.accountInfoIsEqual(validRequest.account, this.getActiveAccount(), false)) {
                                browserRequestLogger.verbose("Setting active account to null");
                                this.setActiveAccount(null);
                            }
                            this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, InteractionType.Popup, validRequest);
                            popupUtils = new PopupUtils(this.browserStorage, this.logger);
                            popupWindow = popupUtils.openPopup(logoutUri, popupName, popup);
                            this.eventHandler.emitEvent(EventType.POPUP_OPENED, InteractionType.Popup, { popupWindow: popupWindow }, null);
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 5, , 6]);
                            // Don't care if this throws an error (User Cancelled)
                            return [4 /*yield*/, popupUtils.monitorPopupForSameOrigin(popupWindow)];
                        case 4:
                            // Don't care if this throws an error (User Cancelled)
                            _a.sent();
                            browserRequestLogger.verbose("Popup successfully redirected to postLogoutRedirectUri");
                            return [3 /*break*/, 6];
                        case 5:
                            e_8 = _a.sent();
                            browserRequestLogger.verbose("Error occurred while monitoring popup for same origin. Session on server may remain active. Error: " + e_8);
                            return [3 /*break*/, 6];
                        case 6:
                            popupUtils.cleanPopup(popupWindow);
                            if (mainWindowRedirectUri) {
                                navigationOptions = {
                                    apiId: ApiId.logoutPopup,
                                    timeout: this.config.system.redirectNavigationTimeout,
                                    noHistory: false
                                };
                                absoluteUrl = UrlString.getAbsoluteUrl(mainWindowRedirectUri, BrowserUtils.getCurrentUri());
                                browserRequestLogger.verbose("Redirecting main window to url specified in the request");
                                browserRequestLogger.verbosePii("Redirecing main window to: " + absoluteUrl);
                                this.navigationClient.navigateInternal(absoluteUrl, navigationOptions);
                            }
                            else {
                                browserRequestLogger.verbose("No main window navigation requested");
                            }
                            return [3 /*break*/, 8];
                        case 7:
                            e_9 = _a.sent();
                            if (popup) {
                                // Close the synchronous popup if an error is thrown before the window unload event is registered
                                popup.close();
                            }
                            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
                            this.eventHandler.emitEvent(EventType.LOGOUT_FAILURE, InteractionType.Popup, null, e_9);
                            serverTelemetryManager.cacheFailedRequest(e_9);
                            throw e_9;
                        case 8:
                            this.eventHandler.emitEvent(EventType.LOGOUT_END, InteractionType.Popup);
                            return [2 /*return*/];
                    }
                });
            });
        };
        // #endregion
        // #region Account APIs
        /**
         * Returns all accounts that MSAL currently has data for.
         * (the account object is created at the time of successful login)
         * or empty array when no accounts are found
         * @returns Array of account objects in cache
         */
        ClientApplication.prototype.getAllAccounts = function () {
            this.logger.verbose("getAllAccounts called");
            return this.isBrowserEnvironment ? this.browserStorage.getAllAccounts() : [];
        };
        /**
         * Returns the signed in account matching username.
         * (the account object is created at the time of successful login)
         * or null when no matching account is found.
         * This API is provided for convenience but getAccountById should be used for best reliability
         * @param userName
         * @returns The account object stored in MSAL
         */
        ClientApplication.prototype.getAccountByUsername = function (userName) {
            var allAccounts = this.getAllAccounts();
            if (!StringUtils.isEmpty(userName) && allAccounts && allAccounts.length) {
                this.logger.verbose("Account matching username found, returning");
                this.logger.verbosePii("Returning signed-in accounts matching username: " + userName);
                return allAccounts.filter(function (accountObj) { return accountObj.username.toLowerCase() === userName.toLowerCase(); })[0] || null;
            }
            else {
                this.logger.verbose("getAccountByUsername: No matching account found, returning null");
                return null;
            }
        };
        /**
         * Returns the signed in account matching homeAccountId.
         * (the account object is created at the time of successful login)
         * or null when no matching account is found
         * @param homeAccountId
         * @returns The account object stored in MSAL
         */
        ClientApplication.prototype.getAccountByHomeId = function (homeAccountId) {
            var allAccounts = this.getAllAccounts();
            if (!StringUtils.isEmpty(homeAccountId) && allAccounts && allAccounts.length) {
                this.logger.verbose("Account matching homeAccountId found, returning");
                this.logger.verbosePii("Returning signed-in accounts matching homeAccountId: " + homeAccountId);
                return allAccounts.filter(function (accountObj) { return accountObj.homeAccountId === homeAccountId; })[0] || null;
            }
            else {
                this.logger.verbose("getAccountByHomeId: No matching account found, returning null");
                return null;
            }
        };
        /**
         * Returns the signed in account matching localAccountId.
         * (the account object is created at the time of successful login)
         * or null when no matching account is found
         * @param localAccountId
         * @returns The account object stored in MSAL
         */
        ClientApplication.prototype.getAccountByLocalId = function (localAccountId) {
            var allAccounts = this.getAllAccounts();
            if (!StringUtils.isEmpty(localAccountId) && allAccounts && allAccounts.length) {
                this.logger.verbose("Account matching localAccountId found, returning");
                this.logger.verbosePii("Returning signed-in accounts matching localAccountId: " + localAccountId);
                return allAccounts.filter(function (accountObj) { return accountObj.localAccountId === localAccountId; })[0] || null;
            }
            else {
                this.logger.verbose("getAccountByLocalId: No matching account found, returning null");
                return null;
            }
        };
        /**
         * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
         * @param account
         */
        ClientApplication.prototype.setActiveAccount = function (account) {
            if (account) {
                this.logger.verbose("setActiveAccount: Active account set");
                this.activeLocalAccountId = account.localAccountId;
            }
            else {
                this.logger.verbose("setActiveAccount: No account passed, active account not set");
                this.activeLocalAccountId = null;
            }
        };
        /**
         * Gets the currently active account
         */
        ClientApplication.prototype.getActiveAccount = function () {
            if (!this.activeLocalAccountId) {
                this.logger.verbose("getActiveAccount: No active account");
                return null;
            }
            return this.getAccountByLocalId(this.activeLocalAccountId);
        };
        // #endregion
        // #region Helpers
        /**
         *
         * Use to get the redirect uri configured in MSAL or null.
         * @param requestRedirectUri
         * @returns Redirect URL
         *
         */
        ClientApplication.prototype.getRedirectUri = function (requestRedirectUri) {
            this.logger.verbose("getRedirectUri called");
            var redirectUri = requestRedirectUri || this.config.auth.redirectUri || BrowserUtils.getCurrentUri();
            return UrlString.getAbsoluteUrl(redirectUri, BrowserUtils.getCurrentUri());
        };
        /**
         * Use to get the redirectStartPage either from request or use current window
         * @param requestStartPage
         */
        ClientApplication.prototype.getRedirectStartPage = function (requestStartPage) {
            var redirectStartPage = requestStartPage || window.location.href;
            return UrlString.getAbsoluteUrl(redirectStartPage, BrowserUtils.getCurrentUri());
        };
        /**
         * Used to get a discovered version of the default authority.
         * @param requestAuthority
         * @param requestCorrelationId
         */
        ClientApplication.prototype.getDiscoveredAuthority = function (requestAuthority, requestCorrelationId) {
            return __awaiter$1(this, void 0, void 0, function () {
                var authorityOptions;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.verbose("getDiscoveredAuthority called", requestCorrelationId);
                            authorityOptions = {
                                protocolMode: this.config.auth.protocolMode,
                                knownAuthorities: this.config.auth.knownAuthorities,
                                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
                                authorityMetadata: this.config.auth.authorityMetadata
                            };
                            if (!requestAuthority) return [3 /*break*/, 2];
                            this.logger.verbose("Creating discovered authority with request authority", requestCorrelationId);
                            return [4 /*yield*/, AuthorityFactory.createDiscoveredInstance(requestAuthority, this.config.system.networkClient, this.browserStorage, authorityOptions)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            this.logger.verbose("Creating discovered authority with configured authority", requestCorrelationId);
                            return [4 /*yield*/, AuthorityFactory.createDiscoveredInstance(this.config.auth.authority, this.config.system.networkClient, this.browserStorage, authorityOptions)];
                        case 3: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Helper to check whether interaction is in progress.
         */
        ClientApplication.prototype.interactionInProgress = function () {
            // Check whether value in cache is present and equal to expected value
            return (this.browserStorage.getTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, true)) === BrowserConstants.INTERACTION_IN_PROGRESS_VALUE;
        };
        /**
         * Creates an Authorization Code Client with the given authority, or the default authority.
         * @param serverTelemetryManager
         * @param authorityUrl
         */
        ClientApplication.prototype.createAuthCodeClient = function (serverTelemetryManager, authorityUrl, correlationId) {
            return __awaiter$1(this, void 0, void 0, function () {
                var clientConfig;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getClientConfiguration(serverTelemetryManager, authorityUrl, correlationId)];
                        case 1:
                            clientConfig = _a.sent();
                            return [2 /*return*/, new AuthorizationCodeClient(clientConfig)];
                    }
                });
            });
        };
        /**
         * Creates an Silent Flow Client with the given authority, or the default authority.
         * @param serverTelemetryManager
         * @param authorityUrl
         */
        ClientApplication.prototype.createSilentFlowClient = function (serverTelemetryManager, authorityUrl, correlationId) {
            return __awaiter$1(this, void 0, void 0, function () {
                var clientConfig;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getClientConfiguration(serverTelemetryManager, authorityUrl, correlationId)];
                        case 1:
                            clientConfig = _a.sent();
                            return [2 /*return*/, new SilentFlowClient(clientConfig)];
                    }
                });
            });
        };
        /**
         * Creates a Refresh Client with the given authority, or the default authority.
         * @param serverTelemetryManager
         * @param authorityUrl
         */
        ClientApplication.prototype.createRefreshTokenClient = function (serverTelemetryManager, authorityUrl, correlationId) {
            return __awaiter$1(this, void 0, void 0, function () {
                var clientConfig;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getClientConfiguration(serverTelemetryManager, authorityUrl, correlationId)];
                        case 1:
                            clientConfig = _a.sent();
                            return [2 /*return*/, new RefreshTokenClient(clientConfig)];
                    }
                });
            });
        };
        /**
         * Creates a Client Configuration object with the given request authority, or the default authority.
         * @param serverTelemetryManager
         * @param requestAuthority
         * @param requestCorrelationId
         */
        ClientApplication.prototype.getClientConfiguration = function (serverTelemetryManager, requestAuthority, requestCorrelationId) {
            return __awaiter$1(this, void 0, void 0, function () {
                var discoveredAuthority;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.verbose("getClientConfiguration called", requestCorrelationId);
                            return [4 /*yield*/, this.getDiscoveredAuthority(requestAuthority, requestCorrelationId)];
                        case 1:
                            discoveredAuthority = _a.sent();
                            return [2 /*return*/, {
                                    authOptions: {
                                        clientId: this.config.auth.clientId,
                                        authority: discoveredAuthority,
                                        clientCapabilities: this.config.auth.clientCapabilities
                                    },
                                    systemOptions: {
                                        tokenRenewalOffsetSeconds: this.config.system.tokenRenewalOffsetSeconds,
                                        preventCorsPreflight: true
                                    },
                                    loggerOptions: {
                                        loggerCallback: this.config.system.loggerOptions.loggerCallback,
                                        piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled,
                                        logLevel: this.config.system.loggerOptions.logLevel,
                                        correlationId: requestCorrelationId
                                    },
                                    cryptoInterface: this.browserCrypto,
                                    networkInterface: this.networkClient,
                                    storageInterface: this.browserStorage,
                                    serverTelemetryManager: serverTelemetryManager,
                                    libraryInfo: {
                                        sku: BrowserConstants.MSAL_SKU,
                                        version: version,
                                        cpu: "",
                                        os: ""
                                    }
                                }];
                    }
                });
            });
        };
        /**
         * Helper to validate app environment before making a request.
         * @param request
         * @param interactionType
         */
        ClientApplication.prototype.preflightInteractiveRequest = function (request, interactionType) {
            this.logger.verbose("preflightInteractiveRequest called, validating app environment", request === null || request === void 0 ? void 0 : request.correlationId);
            // block the reload if it occurred inside a hidden iframe
            BrowserUtils.blockReloadInHiddenIframes();
            // Check if interaction is in progress. Throw error if true.
            if (this.interactionInProgress()) {
                throw BrowserAuthError.createInteractionInProgressError();
            }
            return this.initializeAuthorizationRequest(request, interactionType);
        };
        /**
         * Helper to validate app environment before making an auth request
         * * @param interactionType
         */
        ClientApplication.prototype.preflightBrowserEnvironmentCheck = function (interactionType) {
            this.logger.verbose("preflightBrowserEnvironmentCheck started");
            // Block request if not in browser environment
            BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
            // Block redirects if in an iframe
            BrowserUtils.blockRedirectInIframe(interactionType, this.config.system.allowRedirectInIframe);
            // Block auth requests inside a hidden iframe
            BrowserUtils.blockReloadInHiddenIframes();
            // Block redirectUri opened in a popup from calling MSAL APIs
            BrowserUtils.blockAcquireTokenInPopups();
            // Block redirects if memory storage is enabled but storeAuthStateInCookie is not
            if (interactionType === InteractionType.Redirect &&
                this.config.cache.cacheLocation === BrowserCacheLocation.MemoryStorage &&
                !this.config.cache.storeAuthStateInCookie) {
                throw BrowserConfigurationAuthError.createInMemoryRedirectUnavailableError();
            }
        };
        /**
         * Initializer function for all request APIs
         * @param request
         */
        ClientApplication.prototype.initializeBaseRequest = function (request) {
            this.logger.verbose("Initializing BaseAuthRequest", request.correlationId);
            var authority = request.authority || this.config.auth.authority;
            var scopes = __spread(((request && request.scopes) || []));
            var correlationId = (request && request.correlationId) || this.browserCrypto.createNewGuid();
            // Set authenticationScheme to BEARER if not explicitly set in the request
            if (!request.authenticationScheme) {
                request.authenticationScheme = AuthenticationScheme.BEARER;
                this.logger.verbose("Authentication Scheme wasn't explicitly set in request, defaulting to \"Bearer\" request", request.correlationId);
            }
            else {
                this.logger.verbose("Authentication Scheme set to \"" + request.authenticationScheme + "\" as configured in Auth request", request.correlationId);
            }
            var validatedRequest = __assign$1(__assign$1({}, request), { correlationId: correlationId,
                authority: authority,
                scopes: scopes });
            return validatedRequest;
        };
        /**
         *
         * @param apiId
         * @param correlationId
         * @param forceRefresh
         */
        ClientApplication.prototype.initializeServerTelemetryManager = function (apiId, correlationId, forceRefresh) {
            this.logger.verbose("initializeServerTelemetryManager called", correlationId);
            var telemetryPayload = {
                clientId: this.config.auth.clientId,
                correlationId: correlationId,
                apiId: apiId,
                forceRefresh: forceRefresh || false,
                wrapperSKU: this.wrapperSKU,
                wrapperVer: this.wrapperVer
            };
            return new ServerTelemetryManager(telemetryPayload, this.browserStorage);
        };
        /**
         * Helper to initialize required request parameters for interactive APIs and ssoSilent()
         * @param request
         * @param interactionType
         */
        ClientApplication.prototype.initializeAuthorizationRequest = function (request, interactionType) {
            this.logger.verbose("initializeAuthorizationRequest called", request.correlationId);
            var redirectUri = this.getRedirectUri(request.redirectUri);
            var browserState = {
                interactionType: interactionType
            };
            var state = ProtocolUtils.setRequestState(this.browserCrypto, (request && request.state) || "", browserState);
            var validatedRequest = __assign$1(__assign$1({}, this.initializeBaseRequest(request)), { redirectUri: redirectUri, state: state, nonce: request.nonce || this.browserCrypto.createNewGuid(), responseMode: ResponseMode.FRAGMENT });
            var account = request.account || this.getActiveAccount();
            if (account) {
                this.logger.verbose("Setting validated request account");
                this.logger.verbosePii("Setting validated request account: " + account);
                validatedRequest.account = account;
            }
            // Check for ADAL SSO
            if (StringUtils.isEmpty(validatedRequest.loginHint)) {
                // Only check for adal token if no SSO params are being used
                var adalIdTokenString = this.browserStorage.getTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN);
                if (adalIdTokenString) {
                    var adalIdToken = new AuthToken(adalIdTokenString, this.browserCrypto);
                    this.browserStorage.removeItem(PersistentCacheKeys.ADAL_ID_TOKEN);
                    if (adalIdToken.claims && adalIdToken.claims.upn) {
                        this.logger.verbose("No SSO params used and ADAL token retrieved, setting ADAL upn as loginHint");
                        validatedRequest.loginHint = adalIdToken.claims.upn;
                    }
                }
            }
            this.browserStorage.updateCacheEntries(validatedRequest.state, validatedRequest.nonce, validatedRequest.authority, validatedRequest.loginHint || "", validatedRequest.account || null);
            return validatedRequest;
        };
        /**
         * Generates an auth code request tied to the url request.
         * @param request
         */
        ClientApplication.prototype.initializeAuthorizationCodeRequest = function (request) {
            return __awaiter$1(this, void 0, void 0, function () {
                var generatedPkceParams, authCodeRequest;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.verbose("initializeAuthorizationRequest called", request.correlationId);
                            return [4 /*yield*/, this.browserCrypto.generatePkceCodes()];
                        case 1:
                            generatedPkceParams = _a.sent();
                            authCodeRequest = __assign$1(__assign$1({}, request), { redirectUri: request.redirectUri, code: "", codeVerifier: generatedPkceParams.verifier });
                            request.codeChallenge = generatedPkceParams.challenge;
                            request.codeChallengeMethod = Constants.S256_CODE_CHALLENGE_METHOD;
                            return [2 /*return*/, authCodeRequest];
                    }
                });
            });
        };
        /**
         * Initializer for the logout request.
         * @param logoutRequest
         */
        ClientApplication.prototype.initializeLogoutRequest = function (logoutRequest) {
            this.logger.verbose("initializeLogoutRequest called", logoutRequest === null || logoutRequest === void 0 ? void 0 : logoutRequest.correlationId);
            // Check if interaction is in progress. Throw error if true.
            if (this.interactionInProgress()) {
                throw BrowserAuthError.createInteractionInProgressError();
            }
            var validLogoutRequest = __assign$1({ correlationId: this.browserCrypto.createNewGuid() }, logoutRequest);
            /*
             * Only set redirect uri if logout request isn't provided or the set uri isn't null.
             * Otherwise, use passed uri, config, or current page.
             */
            if (!logoutRequest || logoutRequest.postLogoutRedirectUri !== null) {
                if (logoutRequest && logoutRequest.postLogoutRedirectUri) {
                    this.logger.verbose("Setting postLogoutRedirectUri to uri set on logout request", validLogoutRequest.correlationId);
                    validLogoutRequest.postLogoutRedirectUri = UrlString.getAbsoluteUrl(logoutRequest.postLogoutRedirectUri, BrowserUtils.getCurrentUri());
                }
                else if (this.config.auth.postLogoutRedirectUri === null) {
                    this.logger.verbose("postLogoutRedirectUri configured as null and no uri set on request, not passing post logout redirect", validLogoutRequest.correlationId);
                }
                else if (this.config.auth.postLogoutRedirectUri) {
                    this.logger.verbose("Setting postLogoutRedirectUri to configured uri", validLogoutRequest.correlationId);
                    validLogoutRequest.postLogoutRedirectUri = UrlString.getAbsoluteUrl(this.config.auth.postLogoutRedirectUri, BrowserUtils.getCurrentUri());
                }
                else {
                    this.logger.verbose("Setting postLogoutRedirectUri to current page", validLogoutRequest.correlationId);
                    validLogoutRequest.postLogoutRedirectUri = UrlString.getAbsoluteUrl(BrowserUtils.getCurrentUri(), BrowserUtils.getCurrentUri());
                }
            }
            else {
                this.logger.verbose("postLogoutRedirectUri passed as null, not setting post logout redirect uri", validLogoutRequest.correlationId);
            }
            return validLogoutRequest;
        };
        /**
         * Adds event callbacks to array
         * @param callback
         */
        ClientApplication.prototype.addEventCallback = function (callback) {
            return this.eventHandler.addEventCallback(callback);
        };
        /**
         * Removes callback with provided id from callback array
         * @param callbackId
         */
        ClientApplication.prototype.removeEventCallback = function (callbackId) {
            this.eventHandler.removeEventCallback(callbackId);
        };
        /**
         * Returns the logger instance
         */
        ClientApplication.prototype.getLogger = function () {
            return this.logger;
        };
        /**
         * Replaces the default logger set in configurations with new Logger with new configurations
         * @param logger Logger instance
         */
        ClientApplication.prototype.setLogger = function (logger) {
            this.logger = logger;
        };
        /**
         * Called by wrapper libraries (Angular & React) to set SKU and Version passed down to telemetry, logger, etc.
         * @param sku
         * @param version
         */
        ClientApplication.prototype.initializeWrapperLibrary = function (sku, version) {
            // Validate the SKU passed in is one we expect
            this.wrapperSKU = sku;
            this.wrapperVer = version;
        };
        /**
         * Sets navigation client
         * @param navigationClient
         */
        ClientApplication.prototype.setNavigationClient = function (navigationClient) {
            this.navigationClient = navigationClient;
        };
        return ClientApplication;
    }());

    /*! @azure/msal-browser v2.15.0 2021-06-29 */

    /*
     * Copyright (c) Microsoft Corporation. All rights reserved.
     * Licensed under the MIT License.
     */
    /**
     * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
     * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
     */
    var PublicClientApplication = /** @class */ (function (_super) {
        __extends$1(PublicClientApplication, _super);
        /**
         * @constructor
         * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
         *
         * Important attributes in the Configuration object for auth are:
         * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
         * - authority: the authority URL for your application.
         * - redirect_uri: the uri of your application registered in the portal.
         *
         * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
         * It is of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}
         * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
         * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
         * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
         * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
         *
         * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
         * Full B2C functionality will be available in this library in future versions.
         *
         * @param configuration object for the MSAL PublicClientApplication instance
         */
        function PublicClientApplication(configuration) {
            return _super.call(this, configuration) || this;
        }
        /**
         * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
         * any code that follows this function will not execute.
         *
         * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
         * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
         *
         * @param request
         */
        PublicClientApplication.prototype.loginRedirect = function (request) {
            return __awaiter$1(this, void 0, void 0, function () {
                return __generator$1(this, function (_a) {
                    this.logger.verbose("loginRedirect called");
                    return [2 /*return*/, this.acquireTokenRedirect(request || DEFAULT_REQUEST)];
                });
            });
        };
        /**
         * Use when initiating the login process via opening a popup window in the user's browser
         *
         * @param request
         *
         * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
         */
        PublicClientApplication.prototype.loginPopup = function (request) {
            this.logger.verbose("loginPopup called");
            return this.acquireTokenPopup(request || DEFAULT_REQUEST);
        };
        /**
         * Silently acquire an access token for a given set of scopes. Will use cached token if available, otherwise will attempt to acquire a new token from the network via refresh token.
         *
         * @param {@link (SilentRequest:type)}
         * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
         */
        PublicClientApplication.prototype.acquireTokenSilent = function (request) {
            return __awaiter$1(this, void 0, void 0, function () {
                var account, silentRequest, browserRequestLogger, serverTelemetryManager, silentAuthClient, cachedToken, tokenRenewalResult, tokenRenewalError_1;
                return __generator$1(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.preflightBrowserEnvironmentCheck(InteractionType.Silent);
                            this.logger.verbose("acquireTokenSilent called", request.correlationId);
                            account = request.account || this.getActiveAccount();
                            if (!account) {
                                throw BrowserAuthError.createNoAccountError();
                            }
                            silentRequest = __assign$1(__assign$1(__assign$1({}, request), this.initializeBaseRequest(request)), { account: account, forceRefresh: request.forceRefresh || false });
                            browserRequestLogger = this.logger.clone(name, version, silentRequest.correlationId);
                            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, request);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 9]);
                            serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, silentRequest.correlationId);
                            return [4 /*yield*/, this.createSilentFlowClient(serverTelemetryManager, silentRequest.authority, silentRequest.correlationId)];
                        case 2:
                            silentAuthClient = _a.sent();
                            browserRequestLogger.verbose("Silent auth client created");
                            return [4 /*yield*/, silentAuthClient.acquireCachedToken(silentRequest)];
                        case 3:
                            cachedToken = _a.sent();
                            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, cachedToken);
                            return [2 /*return*/, cachedToken];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5:
                            _a.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, this.acquireTokenByRefreshToken(silentRequest)];
                        case 6:
                            tokenRenewalResult = _a.sent();
                            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, tokenRenewalResult);
                            return [2 /*return*/, tokenRenewalResult];
                        case 7:
                            tokenRenewalError_1 = _a.sent();
                            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, tokenRenewalError_1);
                            throw tokenRenewalError_1;
                        case 8: return [3 /*break*/, 9];
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        return PublicClientApplication;
    }(ClientApplication));

    class AuthService {
        constructor(config) {
            this.client = new PublicClientApplication(config);
        }
        getUser() {
            if (this.user == null) {
                return new Promise((resolve, reject) => {
                    reject();
                });
            }
            return new Promise((resolve, reject) => {
                resolve(this.user);
            });
        }
        async login() {
            this.client.loginPopup({
                scopes: ['openid', 'profile', 'offline_access'],
                prompt: 'select_account'
            })
                .then((result) => {
                this.user = result;
            })
                .catch((e) => {
                console.error('Can\'t login: ' + e.message);
            });
        }
        async logout() {
            await this.client.logoutPopup();
        }
        async getToken(scopes) {
            if (this.user == null) {
                throw new Error('User is not logged in');
            }
            const account = this.client.getAccountByUsername(this.user.account.username);
            const request = {
                scopes: scopes,
                account: account
            };
            try {
                const response = await this.client.acquireTokenSilent(request);
                return await new Promise((resolve, reject) => {
                    resolve(response);
                });
            }
            catch (error) {
                return await this.client.acquireTokenPopup(request);
            }
        }
    }

    /* src/Home.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/Home.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let p;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let button2;
    	let t8;
    	let button3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			p = element("p");
    			p.textContent = `User details: ${/*_authService*/ ctx[0].getUser().then(/*func*/ ctx[3]).catch(func_1)}`;
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Call API";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Call Graph";
    			t6 = space();
    			button2 = element("button");
    			button2.textContent = "Login";
    			t8 = space();
    			button3 = element("button");
    			button3.textContent = "Logout";
    			add_location(p, file$1, 48, 1, 2118);
    			add_location(button0, file$1, 49, 1, 2268);
    			add_location(button1, file$1, 50, 1, 2312);
    			add_location(button2, file$1, 51, 1, 2360);
    			add_location(button3, file$1, 52, 1, 2441);
    			attr_dev(main, "class", "svelte-1h6otfa");
    			add_location(main, file$1, 47, 0, 2110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, p);
    			append_dev(main, t2);
    			append_dev(main, button0);
    			append_dev(main, t4);
    			append_dev(main, button1);
    			append_dev(main, t6);
    			append_dev(main, button2);
    			append_dev(main, t8);
    			append_dev(main, button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*api*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*graph*/ ctx[1], false, false, false),
    					listen_dev(button2, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(button3, "click", /*click_handler_1*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func_1 = error => {
    	return "User not logged in";
    };

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	

    	const _authConfig = {
    		auth: {
    			clientId: "2e4365d1-29b8-4b39-a0a4-fedaa8cfc675",
    			redirectUri: "http://localhost:5003",
    			authority: "https://login.microsoftonline.com/3ea8a579-a1b4-4af9-b63e-7fdc82963153"
    		},
    		cache: {
    			cacheLocation: "sessionStorage",
    			storeAuthStateInCookie: false
    		}
    	};

    	const _client = new HttpClient();
    	const _authService = new AuthService(_authConfig);

    	function graph() {
    		return __awaiter(this, void 0, void 0, function* () {
    			const token = yield _authService.getToken(["user.read"]).then(result => {
    				return result.accessToken;
    			});

    			const url = new URL("https://graph.microsoft.com/v1.0/me");

    			_client.getJSON(url, token).done(data => {
    				console.log(data);
    			}).fail(error => {
    				console.error(error);
    			});
    		});
    	}

    	function api() {
    		return __awaiter(this, void 0, void 0, function* () {
    			const token = yield _authService.getToken(["api://895fe467-4fe0-4f4d-bd8e-ec38e486c5b0/api1"]).then(result => {
    				return result.accessToken;
    			});

    			const url = new URL("http://localhost:5000/weatherforecast");

    			_client.getJSON(url, token).done(data => {
    				console.log(data);
    			}).fail(error => {
    				console.error(error);
    			});
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const func = user => {
    		return JSON.stringify(user.account);
    	};

    	const click_handler = async () => {
    		await _authService.login();
    	};

    	const click_handler_1 = async () => {
    		await _authService.logout();
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		HttpClient,
    		AuthService,
    		jQuery: jquery,
    		_authConfig,
    		_client,
    		_authService,
    		graph,
    		api
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [_authService, graph, api, func, click_handler, click_handler_1];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const routes = [
        { name: '/', component: Home },
        { name: '*', component: Home }
    ];

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let router;
    	let current;
    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(router.$$.fragment);
    			add_location(main, file, 5, 0, 99);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, routes });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
