# JST

Jst writing for build web page like PHP.

Now you can use variables and print this variables, require modules , own modules and another pages.

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

## POST, GET and HEADERS usage

You can use POST, GET and HEADERS variables

### POST

```
<?jst
    print(POST.name)
?>
```

### GET

```
<?jst
    print(GET.name)
?>
```

### HEADERS

```
<?jst
    print(HEADERS.Authorization);
    print(HEADERS["Content-Type"]);
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
    await require("./other-async-page.jst");
```

### For Standarat Modules :

```
    const moment = require("moment");
```

### You can pass data to required page

```
    const data = "test data";
    await require("./partial-page.jst", {data});
```

partial-page.jst

```
<?jst
    print(data);
?>

```

## Console

You can use console

```

console.log("some console write");

```

### Contributors

Now just me :D. You can send me pull request for contibution.
