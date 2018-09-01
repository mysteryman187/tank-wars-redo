const Datastore = require('@google-cloud/datastore');
const { Router } = require('express');
const bodyParser = require('body-parser');
const qs = require('qs');
const cacheControl = require('express-cache-controller');
var jsonParser = bodyParser.json();


const createRoute = (kind, options) => {
    const datastore = new Datastore({
        projectId: options.projectId
    });
    const router = Router();
    router.use(cacheControl({
        noCache: true
    }));  
    /**
     * Query
     */
    router.get(`/${kind}/query`, (req, res) => {
        const datastoreQuery = datastore.createQuery([kind]);
        if (options.ttl) {
            datastoreQuery.filter('timestamp', '>', Date.now() - options.ttl);
        }
        const queryParams = qs.parse(req.query);
        Object.keys(queryParams).forEach((key) => {
            datastoreQuery.filter(key, '=', queryParams[key]);
        });
        
        datastore.runQuery(datastoreQuery, (err, entities, nextQuery) => {
            if (err) {
                console.error(err);
                res.statusCode = 500;
                res.end();
                return;
            }
            const hasMore = nextQuery.moreResults !== Datastore.NO_MORE_RESULTS ? nextQuery.endCursor : false;
            res.json(entities);
            res.end();
        });
    });
    
    router.get(`/${kind}/`, (req, res) => {
        const q = datastore.createQuery([kind]);
        if (options.ttl) {
            q.filter('timestamp', '>', Date.now() - options.ttl);
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
    router.get(`/${kind}/:id`, (req, res) => {
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
    router.delete(`/${kind}`, () => {
        // todo - implement delete action
    });

    /**
    *   update/post
    */
    router.post(`/${kind}/:id`, jsonParser, (req, res) => {
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