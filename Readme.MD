#JST

Jst writing for build web page like PHP pages.

Now you can use variables and print this variables

##Examples

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