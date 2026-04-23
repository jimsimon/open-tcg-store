/**
 * Initializes Web Awesome's base path for loading icon assets at runtime.
 * In production (Docker/nginx), icons are served at /webawesome/.
 */
import { setBasePath } from '@awesome.me/webawesome';

setBasePath('/webawesome');
