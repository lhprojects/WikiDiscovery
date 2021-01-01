from http.server import BaseHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse, parse_qs
import json
import sqlite3
import traceback
import os

os.sys.path.append("../common")

import CF

PORT_NUMBER = 80
WIKI_TITLES_DB_FILE = "../data/wiki_titles.db"
WIKI_LINKS1 = "../data/pages_link_to_this_page_also_link_to.npz"
WIKI_LINKS2 = "../data/pages_this_page_link_to_also_linked_by.npz"



itemCFCached = CF.ItemCFCached(pages_link_to_this_page_also_link_to=WIKI_LINKS1,
                         pages_this_page_link_to_also_linked_by=WIKI_LINKS2,
                         titles = None)

class MyHandler(BaseHTTPRequestHandler):
    def address_string(self):
        host, port = self.client_address[:2]
        #return socket.getfqdn(host)
        return host
        
    # Handler for the GET requests
    def do_GET(self):
        
        try:
            # str
            parse_result = urlparse(self.path)
            
            query = parse_result.query
            query = parse_qs(query)
            if "article" not in query:
                raise Exception("no article option")
            
            title = query["article"][0]
                
            res = get_links(self.conn, title)
            if res is None:
                raise Exception("article not found")
            
            res = json.dumps(res)
            bs = bytes(res, encoding="utf-8")
            
            
        except Exception as e:
            traceback.print_tb(e.__traceback__)
            self.send_response(404)
            return

        try:
            self.send_response(200)
            self.send_header('Content-type','application/json')
            self.end_headers()
            
            self.wfile.write(bs)
        except Exception as e:
            traceback.print_tb(e.__traceback__)
        
def get_list(conn, c, r):
    res = []
    if r is not None:
        for idx in r:
            if idx is not None and idx >= 0:
                c.execute("select * from page_titles where idx = ?", (str(idx),))                
                row = c.fetchone()
                if row is not None:
                    # title is the second field
                    res.append(row[1])
    return res
        

def get_links(conn, title):
    c = conn.cursor()
    
    c.execute("select * from page_title_indices where title = ?", (title,))
    res = c.fetchone()
    if res is not None:
        # second coloumn is the index
        idx = int(res[1])
        r1 = itemCFCached.pages_link_to_this_page_also_link_to(idx)
        r2 = itemCFCached.pages_this_page_link_to_also_linked_by(idx)
        r1 = get_list(conn, c, r1)
        r2 = get_list(conn, c, r2)
            
        return [r1, r2]

def start_server():

    try:
        conn = sqlite3.connect(WIKI_TITLES_DB_FILE)
        MyHandler.conn = conn
                
        # Create a web server and define the handler to manage the
        # incoming request
        server = HTTPServer(('', PORT_NUMBER), MyHandler)
        print('Started httpserver on port ' , PORT_NUMBER)

        # Wait forever for incoming http requests
        server.serve_forever()

    except KeyboardInterrupt:
        print ('^C received, shutting down the web server')
        server.socket.close()

    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    start_server()
