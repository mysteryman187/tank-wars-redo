const Datastore = require('@google-cloud/datastore');
const { Router } = require('express');
var bodyParser = require('body-parser');
const qs = require('qs');
var jsonParser = bodyParser.json();

const createRoute = (type, options) => {
    const datastore = new Datastore({
        projectId: options.projectId
    });
    const router = Router();
    const kind = type;
    /**
     * Query
     */
    router.get(`/${type}/query`, (req, res) => {
        const q = datastore.createQuery([kind]);
        if (options.query && options.query.filter) {
            options.query.filter(q, qs.parse(req.query));
        }
        if (options.ttl) {
            q.filter('timestamp', '>', Date.now() - options.query.ttl);
        }
        datastore.runQuery(q, (err, entities, nextQuery) => {
            if (err) {
                res.statusCode = 500;
                res.end();
                return;
            }
            const hasMore = nextQuery.moreResults !== Datastore.NO_MORE_RESULTS ? nextQuery.endCursor : false;
            res.json(entities);
            res.end();
        });
    });
    router.get(`/${type}/`, (req, res) => {
        const q = datastore.createQuery([kind]);
        if (options.ttl) {
            q.filter('timestamp', '>', Date.now() - options.query.ttl);
        }
        datastore.runQuery(q, (err, entities, nextQuery) => {
            if (err) {
                res.statusCode = 500;
                res.end();
                return;
            }
            const hasMore = nextQuery.moreResults !== Datastore.NO_MORE_RESULTS ? nextQuery.endCursor : false;
            res.json(entities);
            res.end();
        });
    });
    /**
     * /Get
    */
    router.get(`/${type}/:id`, (req, res) => {
        const key = datastore.key([kind, req.params.id]);
        datastore.get(key, (err, entity) => {
            if (err) {
                console.error(err);
                res.statusCode = 500;
            } else if (entity) {
                res.json(entity);
            } else {
                res.statusCode = 404;
            }
            res.end();
        });
    });

    /**
    *   delete
    */
    router.delete(`/${type}`, () => {
        // todo - implement delete action
    });

    /**
    *   update/post
    */
    router.post(`/${type}/:id`, jsonParser, (req, res) => {
        const key = datastore.key([kind, req.params.id]);
        const data = {
            ...req.body,
            timestamp: Date.now()
        };
        datastore.save({
            key,
            data
        }).then(() => {
            res.statusCode = 201;
            res.end();
        }).catch(err => {
            console.error('ERROR:', err);
            res.statusCode = 500;
            res.end();
        });
    });
    return router;
};

module.exports.createRoute = createRoute;