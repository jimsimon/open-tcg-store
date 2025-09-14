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
    cmd="[ ! -f sqlite-data/mtg.sqlite ] && tilt trigger 'Download Card MTG Data' || true"
)

local_resource(
    "Download MTG Card Data",
    trigger_mode=TRIGGER_MODE_MANUAL,
    auto_init=False,
    resource_deps=["Database"],
    cmd="wget -O sqlite-data/mtg.sqlite https://mtgjson.com/api/v5/AllPrintings.sqlite"
)

local_resource(
    "Download Today's MTG Pricing Data",
    trigger_mode=TRIGGER_MODE_MANUAL,
    auto_init=False,
    resource_deps=["Database"],
    cmd="wget -O sqlite-data/mtg-prices-daily.json.bz2 https://mtgjson.com/api/v5/AllPricesToday.json.bz2 && bunzip2 sqlite-data/mtg-prices-daily.json.bz2"
)
