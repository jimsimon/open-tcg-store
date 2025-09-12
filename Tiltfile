local_resource(
    "UI Server",
    serve_cmd="pnpm --filter @open-tcgs/ui run dev",
    resource_deps=["Database"]
)

local_resource(
    "API Server",
    serve_cmd="pnpm --filter @open-tcgs/api run dev",
    resource_deps=["Database"]
)

local_resource(
    "Database",
    cmd="[ ! -f sqlite-data/mtg.sqlite ] && tilt trigger 'Download MTG Data' || true"
)

local_resource(
    "Download MTG Data",
    trigger_mode=TRIGGER_MODE_MANUAL,
    auto_init=False,
    resource_deps=["Database"],
    cmd="wget -O sqlite-data/mtg.sqlite https://mtgjson.com/api/v5/AllPrintings.sqlite"
)
