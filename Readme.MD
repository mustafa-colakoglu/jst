# JST

Jst writing for build web page like PHP.

Now you can use variables and print this variables

## Installing

Clone this repository, build pages on www ( page.jst ) and enjoy!

## Examples

```
<?jst
    const title = "test page";
    const content = "test content";
?>
<html>
    <head>
        <title><?jst
            print(title);
        ?></title>
    </head>
    <body>
        <?jst
            print(content);
        ?>
        <img src="/test.png" />
    </body>
</html>
```

## POST and GET usage

You can use POST and GET variables

```
<?jst
    print(POST.name)
?>
```

or

```
<?jst
    print(GET.name)
?>
```

## Using MySQL

You can use MySQL.
We are added mysql-promise package for MySQL support.

Example :

```
<?jst
    const query = await mysql.query("SELECT * FROM test");
    const [rows] = query;
    for(let i=0; i < rows.length; i++){
        print(rows[i].name);
    }


?>
```

## Require other modules or pages

### For Async pages :

```
    require("./other-async-page.jst");
```

### For Standarat Modules :

```
    require("moment");
```

### Contributors

Now just me :D. You can send me pull request for contibution.
