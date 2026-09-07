Google auth redirects to page not found

frontend-1  | 127.0.0.1 - - [03/Sep/2026:13:41:16 +0000] "HEAD / HTTP/1.1" 200 0 "-" "Wget/1.25.0" "-"
backend-1   | 172.18.0.5:45160 - - [03/Sep/2026:15:41:17] "GET /api/auth/google/callback/?state=29Qa3yhlgThrUbyVQkz9I9XehUBWYj&iss=https://accounts.google.com&code=4/0ATsMZqBrFFjftC4r--ITtVi4pKEJNwonNOginpByNq5TVCxt7eDMImpJuwkxIW20I0oH3g&scope=email+profile+https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email+openid&authuser=0&prompt=consent" 302 -
nginx-1     | 172.18.0.1 - - [03/Sep/2026:13:41:17 +0000] "GET /api/auth/google/callback/?state=29Qa3yhlgThrUbyVQkz9I9XehUBWYj&iss=https://accounts.google.com&code=4/0ATsMZqBrFFjftC4r--ITtVi4pKEJNwonNOginpByNq5TVCxt7eDMImpJuwkxIW20I0oH3g&scope=email+profile+https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email+openid&authuser=0&prompt=consent HTTP/1.1" 302 0 "https://accounts.google.com/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
nginx-1     | 172.18.0.1 - - [03/Sep/2026:13:41:17 +0000] "GET //auth/google/callback?ticket=CKKBBRpeTYIGJCaqPdL5nvC27cgTKGbBIi-AmtfUgxU HTTP/1.1" 200 490 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
frontend-1  | 172.18.0.5 - - [03/Sep/2026:13:41:17 +0000] "GET //auth/google/callback?ticket=CKKBBRpeTYIGJCaqPdL5nvC27cgTKGbBIi-AmtfUgxU HTTP/1.1" 200 490 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36" "172.18.0.1"
nginx-1     | 172.18.0.1 - - [03/Sep/2026:13:41:17 +0000] "GET /assets/index-BjHeTKJf.css HTTP/1.1" 200 71296 "https://localhost//auth/google/callback?ticket=CKKBBRpeTYIGJCaqPdL5nvC27cgTKGbBIi-AmtfUgxU" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
frontend-1  | 172.18.0.5 - - [03/Sep/2026:13:41:17 +0000] "GET /assets/index-BjHeTKJf.css HTTP/1.1" 200 71296 "https://localhost//auth/google/callback?ticket=CKKBBRpeTYIGJCaqPdL5nvC27cgTKGbBIi-AmtfUgxU" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36" "172.18.0.1"
frontend-1  | 172.18.0.5 - - [03/Sep/2026:13:41:17 +0000] "GET /assets/index-Dz9S-kUW.js HTTP/1.1" 200 564520 "https://localhost//auth/google/callback?ticket=CKKBBRpeTYIGJCaqPdL5nvC27cgTKGbBIi-AmtfUgxU" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36" "172.18.0.1"
nginx-1     | 172.18.0.1 - - [03/Sep/2026:13:41:17 +0000] "GET /assets/index-Dz9S-kUW.js HTTP/1.1" 200 564520 "https://localhost//auth/google/callback?ticket=CKKBBRpeTYIGJCaqPdL5nvC27cgTKGbBIi-AmtfUgxU" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
frontend-1  | 172.18.0.5 - - [03/Sep/2026:13:41:23 +0000] "HEAD / HTTP/1.1" 200 0 "-" "Wget/1.25.0" "127.0.0.1"
nginx-1     | 127.0.0.1 - - [03/Sep/2026:13:41:23 +0000] "HEAD / HTTP/1.1" 200 0 "-" "Wget/1.25.0"
backend-1   | 127.0.0.1:59152 - - [03/Sep/2026:15:41:24] "GET /" 200 15
frontend-1  | 127.0.0.1 - - [03/Sep/2026:13:41:26 +0000] "HEAD / HTTP/1.1" 200 0 "-" "Wget/1.25.0" "-"
nginx-1     | 127.0.0.1 - - [03/Sep/2026:13:41:33 +0000] "HEAD / HTTP/1.1" 200 0 "-" "Wget/1.25.0"
frontend-1  | 172.18.0.5 - - [03/Sep/2026:13:41:33 +0000] "HEAD / HTTP/1.1" 200 0 "-" "Wget/1.25.0" "127.0.0.1"
backend-1   | 127.0.0.1:46028 - - [03/Sep/2026:15:41:35] "GET /" 200 15
frontend-1  | 127.0.0.1 - - [03/Sep/2026:13:41:36 +0000] "HEAD / HTTP/1.1" 200 0 "-" "Wget/1.25.0" "-"
