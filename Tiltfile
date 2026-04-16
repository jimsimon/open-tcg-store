local_resource(
    "API Server",
    serve_cmd="pnpm --filter @open-tcgs/api run dev",
    resource_deps=[]
)

local_resource(
    "UI Server",
    serve_cmd="pnpm --filter @open-tcgs/ui run dev",
    resource_deps=['API Server']
)

local_resource(
    "Nginx Proxy",
    serve_cmd="docker rm -f otcgs-nginx 2>/dev/null; docker run --rm --name otcgs-nginx --add-host=host.docker.internal:host-gateway -v $PWD/nginx/nginx.conf:/etc/nginx/nginx.conf:ro -p 80:80 nginx:1.27-alpine",
    resource_deps=['UI Server', 'API Server']
)
