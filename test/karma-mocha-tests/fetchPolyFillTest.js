define([
	"persist/persistenceManager",
	"persist/defaultResponseProxy",
	"persist/persistenceStoreManager",
	"persist/localPersistenceStoreFactory",
	"MockFetch",
	"persist/impl/logger",
], function (
	persistenceManager,
	defaultResponseProxy,
	persistenceStoreManager,
	localPersistenceStoreFactory,
	MockFetch,
	logger
) {
	"use strict";
	//logger.option('level',  logger.LEVEL_LOG);
	var mockFetch = new MockFetch();
	persistenceStoreManager.registerDefaultStoreFactory(localPersistenceStoreFactory);

	persistenceManager.init().then(function () {
		describe("persist/persistenceManager - fetch polyfill", function () {
			this.timeout(30000);
			afterEach(function (done) {
				persistenceManager.forceOffline(false);
				persistenceStoreManager
					.openStore("syncLog")
					.then(function (store) {
						return store.delete();
					})
					.then(function () {
						return persistenceStoreManager.openStore("offlineCaches-systemCache");
					})
					.then(function (store) {
						return store.delete();
					})
					.then(function () {
						done();
					});
			});
			it("browserFetch()", function (done) {
				mockFetch.addRequestReply(
					"GET",
					"/testBrowserFetch",
					{
						status: 200,
						body: "Ok",
					},
					function () {
						assert.ok(true, "Mock Fetch received Request");
					}
				);

				persistenceManager
					.register({
						scope: "/testBrowserFetch",
					})
					.then(function (registration) {
						var defaultTestResponseProxy = defaultResponseProxy.getResponseProxy();
						registration.addEventListener("fetch", defaultTestResponseProxy.getFetchEventListener());

						fetch("/testBrowserFetch").then(function (response) {
							assert.ok(true, "Received Response when online");
							persistenceManager.forceOffline(true);
							persistenceManager.browserFetch("/testBrowserFetch").then(function (response) {
								assert.ok(response instanceof Response, "Received Response when browserFetch() called");
								registration.unregister().then(function (unregistered) {
									assert.ok(unregistered == true, "unregistered scope");
									done();
								});
							});
						});
					});
			});
		});
	});
});
