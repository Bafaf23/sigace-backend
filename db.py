# db.py
from flaskext.mysql import MySQL
import pymysql

mysql = MySQL()


def get_db_cursor():
    """Retorna un cursor configurado como diccionario"""
    return mysql.get_db().cursor(pymysql.cursors.DictCursor)
