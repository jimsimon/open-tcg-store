import { eq } from "drizzle-orm";
import { category, otcgs, price, product } from "./packages/api/src/db";

const results = await otcgs.select().from(price).where(eq(price.productId, 87631));
console.log(results);
